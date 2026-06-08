import structlog
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.ehr import (
    MedicalRecord, VisitType, Diagnosis, Prescription, Allergy, Immunization, FamilyHistory,
    AllergySeverity, DiagnosisType,
)
from models.user import User
from routers.auth import get_current_user
from services.ehr_service import (
    create_medical_record,
    get_patient_records,
    get_record_detail,
    get_patient_summary,
    add_vital_signs,
    add_prescription,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateRecordBody(BaseModel):
    patient_id: str
    doctor_id: str
    visit_date: str
    visit_type: VisitType
    appointment_id: Optional[str] = None
    chief_complaint: Optional[str] = None
    chief_complaint_bn: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    clinical_notes: Optional[str] = None


class VitalSignBody(BaseModel):
    parameter_name: str
    value: float
    unit: str


class DiagnosisBody(BaseModel):
    diagnosis_name: str
    diagnosis_name_bn: Optional[str] = None
    icd_code: Optional[str] = None
    diagnosis_type: DiagnosisType = DiagnosisType.PRIMARY
    notes: Optional[str] = None


class PrescriptionBody(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    medicine_name_bn: Optional[str] = None
    duration_days: Optional[int] = None
    route: str = "oral"
    instructions: Optional[str] = None
    instructions_bn: Optional[str] = None
    inventory_item_id: Optional[str] = None


class AllergyBody(BaseModel):
    allergen: str
    allergen_bn: Optional[str] = None
    severity: AllergySeverity = AllergySeverity.MILD
    reaction: Optional[str] = None


class ImmunizationBody(BaseModel):
    vaccine_name: str
    vaccine_name_bn: Optional[str] = None
    dose_number: Optional[int] = None
    administered_date: str
    next_due_date: Optional[str] = None
    administered_by: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class FamilyHistoryBody(BaseModel):
    relationship: str
    condition: str
    condition_bn: Optional[str] = None
    notes: Optional[str] = None


@router.post("/records")
async def create_record(
    body: CreateRecordBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        visit_date = date.fromisoformat(body.visit_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    record = await create_medical_record(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        doctor_id=body.doctor_id,
        visit_date=visit_date,
        visit_type=body.visit_type,
        db=db,
        appointment_id=body.appointment_id,
        chief_complaint=body.chief_complaint,
        chief_complaint_bn=body.chief_complaint_bn,
        history_of_present_illness=body.history_of_present_illness,
        assessment=body.assessment,
        plan=body.plan,
        clinical_notes=body.clinical_notes,
    )
    return {"id": record.id, "visit_date": record.visit_date.isoformat()}


@router.get("/records")
async def list_records(
    patient_id: str = Query(...),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_patient_records(
        patient_id=patient_id,
        db=db,
        clinic_id=current_user.clinic_id,
        limit=limit,
    )


@router.get("/records/{record_id}")
async def get_record(record_id: str, db: AsyncSession = Depends(get_db)):
    try:
        return await get_record_detail(record_id=record_id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/patients/{patient_id}/summary")
async def patient_summary(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_patient_summary(
        patient_id=patient_id,
        db=db,
        clinic_id=current_user.clinic_id,
    )


@router.post("/records/{record_id}/vitals")
async def add_vitals(
    record_id: str,
    vitals: list[VitalSignBody],
    db: AsyncSession = Depends(get_db),
):
    created = await add_vital_signs(
        record_id=record_id,
        vitals_data=[v.model_dump() for v in vitals],
        db=db,
    )
    return {"count": len(created), "vitals": [{"parameter": v.parameter_name, "value": v.value} for v in created]}


@router.post("/records/{record_id}/diagnoses")
async def add_diagnosis(
    record_id: str,
    body: DiagnosisBody,
    db: AsyncSession = Depends(get_db),
):
    diag = Diagnosis(
        record_id=record_id,
        diagnosis_name=body.diagnosis_name,
        diagnosis_name_bn=body.diagnosis_name_bn,
        icd_code=body.icd_code,
        diagnosis_type=body.diagnosis_type,
        notes=body.notes,
    )
    db.add(diag)
    await db.flush()
    return {"id": diag.id, "diagnosis": diag.diagnosis_name, "icd_code": diag.icd_code}


@router.post("/records/{record_id}/prescriptions")
async def add_prescription_endpoint(
    record_id: str,
    body: PrescriptionBody,
    db: AsyncSession = Depends(get_db),
):
    rx = await add_prescription(
        record_id=record_id,
        medicine_name=body.medicine_name,
        dosage=body.dosage,
        frequency=body.frequency,
        db=db,
        medicine_name_bn=body.medicine_name_bn,
        duration_days=body.duration_days,
        route=body.route,
        instructions=body.instructions,
        instructions_bn=body.instructions_bn,
        inventory_item_id=body.inventory_item_id,
    )
    return {"id": rx.id, "medicine": rx.medicine_name, "dosage": rx.dosage}


@router.post("/patients/{patient_id}/allergies")
async def add_allergy(
    patient_id: str,
    body: AllergyBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allergy = Allergy(
        patient_id=patient_id,
        allergen=body.allergen,
        allergen_bn=body.allergen_bn,
        severity=body.severity,
        reaction=body.reaction,
    )
    db.add(allergy)
    await db.flush()
    return {"id": allergy.id, "allergen": allergy.allergen, "severity": allergy.severity.value}


@router.get("/patients/{patient_id}/allergies")
async def list_allergies(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Allergy).where(Allergy.patient_id == patient_id, Allergy.is_active == True)
    )
    allergies = result.scalars().all()
    return [
        {"id": a.id, "allergen": a.allergen, "severity": a.severity.value, "reaction": a.reaction}
        for a in allergies
    ]


@router.post("/patients/{patient_id}/immunizations")
async def add_immunization(
    patient_id: str,
    body: ImmunizationBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        admin_date = date.fromisoformat(body.administered_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid administered_date format")

    next_due = None
    if body.next_due_date:
        try:
            next_due = date.fromisoformat(body.next_due_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid next_due_date format")

    imm = Immunization(
        patient_id=patient_id,
        vaccine_name=body.vaccine_name,
        vaccine_name_bn=body.vaccine_name_bn,
        dose_number=body.dose_number,
        administered_date=admin_date,
        next_due_date=next_due,
        administered_by=body.administered_by,
        batch_number=body.batch_number,
        notes=body.notes,
    )
    db.add(imm)
    await db.flush()
    return {"id": imm.id, "vaccine": imm.vaccine_name, "date": imm.administered_date.isoformat()}


@router.get("/patients/{patient_id}/immunizations")
async def list_immunizations(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Immunization).where(Immunization.patient_id == patient_id).order_by(Immunization.administered_date.desc())
    )
    imms = result.scalars().all()
    return [
        {
            "id": i.id,
            "vaccine": i.vaccine_name,
            "dose": i.dose_number,
            "date": i.administered_date.isoformat(),
            "next_due": i.next_due_date.isoformat() if i.next_due_date else None,
        }
        for i in imms
    ]


@router.post("/patients/{patient_id}/family-history")
async def add_family_history(
    patient_id: str,
    body: FamilyHistoryBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fh = FamilyHistory(
        patient_id=patient_id,
        relationship=body.relationship,
        condition=body.condition,
        condition_bn=body.condition_bn,
        notes=body.notes,
    )
    db.add(fh)
    await db.flush()
    return {"id": fh.id, "relationship": fh.relationship, "condition": fh.condition}
