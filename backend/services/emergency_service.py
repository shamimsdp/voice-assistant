import structlog
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from models.emergency import EmergencyCase, AmbulanceDispatch, TriageLevel, EmergencyStatus, AmbulanceStatus

logger = structlog.get_logger()


async def create_emergency_case(
    clinic_id: str,
    triage_level: TriageLevel,
    chief_complaint: str,
    db: AsyncSession,
    patient_id: Optional[str] = None,
    patient_name: Optional[str] = None,
    patient_phone: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = None,
    chief_complaint_bn: Optional[str] = None,
    symptoms: Optional[dict] = None,
    vital_signs: Optional[dict] = None,
    allergies: Optional[str] = None,
    triaged_by: Optional[str] = None,
) -> EmergencyCase:
    case_count = await db.execute(select(func.count(EmergencyCase.id)))
    count = case_count.scalar() or 0
    case_number = f"ER-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:04d}"

    case = EmergencyCase(
        clinic_id=clinic_id,
        patient_id=patient_id,
        case_number=case_number,
        triage_level=triage_level,
        status=EmergencyStatus.TRIAGED,
        patient_name=patient_name,
        patient_phone=patient_phone,
        age=age,
        gender=gender,
        chief_complaint=chief_complaint,
        chief_complaint_bn=chief_complaint_bn,
        symptoms=symptoms,
        vital_signs=vital_signs,
        allergies=allergies,
        triaged_by=triaged_by,
    )
    db.add(case)
    await db.flush()
    logger.info("Emergency case created", case_number=case_number, triage=triage_level.value)
    return case


async def get_emergency_cases(
    clinic_id: str,
    db: AsyncSession,
    status: Optional[EmergencyStatus] = None,
    triage_level: Optional[TriageLevel] = None,
    limit: int = 50,
) -> List[Dict]:
    conditions = [EmergencyCase.clinic_id == clinic_id]
    if status:
        conditions.append(EmergencyCase.status == status)
    if triage_level:
        conditions.append(EmergencyCase.triage_level == triage_level)

    query = select(EmergencyCase).where(and_(*conditions)).order_by(EmergencyCase.triaged_at.desc()).limit(limit)
    result = await db.execute(query)
    cases = result.scalars().all()

    return [
        {
            "id": c.id,
            "case_number": c.case_number,
            "triage_level": c.triage_level.value,
            "status": c.status.value,
            "patient_name": c.patient_name or c.patient_id,
            "chief_complaint": c.chief_complaint,
            "age": c.age,
            "gender": c.gender,
            "triaged_at": c.triaged_at.isoformat(),
            "triaged_by": c.triaged_by,
            "treated_by": c.treated_by,
            "disposition": c.disposition,
        }
        for c in cases
    ]


async def dispatch_ambulance(
    clinic_id: str,
    case_id: str,
    pickup_address: str,
    destination: str,
    db: AsyncSession,
    ambulance_id: Optional[str] = None,
    driver_name: Optional[str] = None,
    driver_phone: Optional[str] = None,
    notes: Optional[str] = None,
) -> AmbulanceDispatch:
    dispatch = AmbulanceDispatch(
        clinic_id=clinic_id,
        case_id=case_id,
        ambulance_id=ambulance_id,
        driver_name=driver_name,
        driver_phone=driver_phone,
        pickup_address=pickup_address,
        destination=destination,
        status=AmbulanceStatus.DISPATCHED,
        notes=notes,
    )
    db.add(dispatch)
    await db.flush()
    logger.info("Ambulance dispatched", case_id=case_id, destination=destination)
    return dispatch
