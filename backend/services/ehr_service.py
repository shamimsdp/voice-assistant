import structlog
from datetime import datetime, date
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from models.ehr import (
    MedicalRecord, VitalSign, Diagnosis, Prescription, Allergy, Immunization, FamilyHistory,
    VisitType, AllergySeverity, DiagnosisType,
)

logger = structlog.get_logger()


async def create_medical_record(
    clinic_id: str,
    patient_id: str,
    doctor_id: str,
    visit_date: date,
    visit_type: VisitType,
    db: AsyncSession,
    appointment_id: Optional[str] = None,
    chief_complaint: Optional[str] = None,
    chief_complaint_bn: Optional[str] = None,
    history_of_present_illness: Optional[str] = None,
    assessment: Optional[str] = None,
    plan: Optional[str] = None,
    clinical_notes: Optional[str] = None,
) -> MedicalRecord:
    record = MedicalRecord(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        visit_date=visit_date,
        visit_type=visit_type,
        chief_complaint=chief_complaint,
        chief_complaint_bn=chief_complaint_bn,
        history_of_present_illness=history_of_present_illness,
        assessment=assessment,
        plan=plan,
        clinical_notes=clinical_notes,
    )
    db.add(record)
    await db.flush()
    logger.info("Medical record created", record_id=record.id, patient_id=patient_id)
    return record


async def get_patient_records(
    patient_id: str,
    db: AsyncSession,
    clinic_id: Optional[str] = None,
    limit: int = 50,
) -> List[Dict]:
    conditions = [MedicalRecord.patient_id == patient_id]
    if clinic_id:
        conditions.append(MedicalRecord.clinic_id == clinic_id)

    query = select(MedicalRecord).where(and_(*conditions)).order_by(MedicalRecord.visit_date.desc()).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()

    return [
        {
            "id": r.id,
            "visit_date": r.visit_date.isoformat(),
            "visit_type": r.visit_type.value,
            "doctor_id": r.doctor_id,
            "chief_complaint": r.chief_complaint,
            "chief_complaint_bn": r.chief_complaint_bn,
            "assessment": r.assessment,
            "plan": r.plan,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


async def get_record_detail(
    record_id: str,
    db: AsyncSession,
) -> Dict:
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("Record not found")

    vital_result = await db.execute(select(VitalSign).where(VitalSign.record_id == record_id))
    vitals = vital_result.scalars().all()

    diag_result = await db.execute(select(Diagnosis).where(Diagnosis.record_id == record_id))
    diagnoses = diag_result.scalars().all()

    rx_result = await db.execute(select(Prescription).where(Prescription.record_id == record_id))
    prescriptions = rx_result.scalars().all()

    return {
        "id": record.id,
        "visit_date": record.visit_date.isoformat(),
        "visit_type": record.visit_type.value,
        "doctor_id": record.doctor_id,
        "chief_complaint": record.chief_complaint,
        "history_of_present_illness": record.history_of_present_illness,
        "assessment": record.assessment,
        "plan": record.plan,
        "clinical_notes": record.clinical_notes,
        "vitals": [
            {"parameter_name": v.parameter_name, "value": v.value, "unit": v.unit.value}
            for v in vitals
        ],
        "diagnoses": [
            {"name": d.diagnosis_name, "icd_code": d.icd_code, "type": d.diagnosis_type.value}
            for d in diagnoses
        ],
        "prescriptions": [
            {
                "medicine_name": p.medicine_name,
                "dosage": p.dosage,
                "frequency": p.frequency,
                "duration_days": p.duration_days,
                "route": p.route,
                "instructions": p.instructions,
            }
            for p in prescriptions
        ],
    }


async def get_patient_summary(
    patient_id: str,
    db: AsyncSession,
    clinic_id: Optional[str] = None,
) -> Dict:
    records = await get_patient_records(patient_id, db, clinic_id=clinic_id, limit=100)

    all_diagnoses = []
    for r in records:
        diag_result = await db.execute(select(Diagnosis).where(Diagnosis.record_id == r["id"]))
        for d in diag_result.scalars().all():
            all_diagnoses.append({"name": d.diagnosis_name, "icd_code": d.icd_code})

    allergy_result = await db.execute(
        select(Allergy).where(Allergy.patient_id == patient_id, Allergy.is_active == True)
    )
    allergies = allergy_result.scalars().all()

    immunization_result = await db.execute(
        select(Immunization).where(Immunization.patient_id == patient_id).order_by(Immunization.administered_date.desc())
    )
    immunizations = immunization_result.scalars().all()

    family_result = await db.execute(select(FamilyHistory).where(FamilyHistory.patient_id == patient_id))
    family_history = family_result.scalars().all()

    return {
        "total_visits": len(records),
        "visit_types": {t.value: sum(1 for r in records if r["visit_type"] == t.value) for t in VisitType},
        "chronic_diagnoses": list({d["name"] for d in all_diagnoses}),
        "active_allergies": [
            {"allergen": a.allergen, "severity": a.severity.value, "reaction": a.reaction}
            for a in allergies
        ],
        "immunizations": [
            {
                "vaccine": i.vaccine_name,
                "dose": i.dose_number,
                "date": i.administered_date.isoformat(),
                "next_due": i.next_due_date.isoformat() if i.next_due_date else None,
            }
            for i in immunizations
        ],
        "family_history": [
            {"relationship": f.relationship, "condition": f.condition}
            for f in family_history
        ],
    }


async def add_vital_signs(
    record_id: str,
    vitals_data: List[Dict],
    db: AsyncSession,
) -> List[VitalSign]:
    vitals = []
    for v in vitals_data:
        vital = VitalSign(
            record_id=record_id,
            parameter_name=v["parameter_name"],
            value=v["value"],
            unit=v["unit"],
        )
        db.add(vital)
        vitals.append(vital)
    await db.flush()
    return vitals


async def add_prescription(
    record_id: str,
    medicine_name: str,
    dosage: str,
    frequency: str,
    db: AsyncSession,
    medicine_name_bn: Optional[str] = None,
    duration_days: Optional[int] = None,
    route: str = "oral",
    instructions: Optional[str] = None,
    instructions_bn: Optional[str] = None,
    inventory_item_id: Optional[str] = None,
) -> Prescription:
    rx = Prescription(
        record_id=record_id,
        inventory_item_id=inventory_item_id,
        medicine_name=medicine_name,
        medicine_name_bn=medicine_name_bn,
        dosage=dosage,
        frequency=frequency,
        duration_days=duration_days,
        route=route,
        instructions=instructions,
        instructions_bn=instructions_bn,
    )
    db.add(rx)
    await db.flush()
    return rx
