import structlog
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.emergency import EmergencyCase, AmbulanceDispatch, TriageLevel, EmergencyStatus, AmbulanceStatus
from models.user import User
from routers.auth import get_current_user
from services.emergency_service import create_emergency_case, get_emergency_cases, dispatch_ambulance

router = APIRouter()
logger = structlog.get_logger()


class CreateCaseBody(BaseModel):
    triage_level: TriageLevel
    chief_complaint: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint_bn: Optional[str] = None
    symptoms: Optional[dict] = None
    vital_signs: Optional[dict] = None
    allergies: Optional[str] = None
    triaged_by: Optional[str] = None


class DispatchAmbulanceBody(BaseModel):
    case_id: str
    pickup_address: str
    destination: str
    ambulance_id: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    notes: Optional[str] = None


@router.post("/cases")
async def create_case(
    body: CreateCaseBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = await create_emergency_case(
        clinic_id=current_user.clinic_id,
        triage_level=body.triage_level,
        chief_complaint=body.chief_complaint,
        db=db,
        patient_id=body.patient_id,
        patient_name=body.patient_name,
        patient_phone=body.patient_phone,
        age=body.age,
        gender=body.gender,
        chief_complaint_bn=body.chief_complaint_bn,
        symptoms=body.symptoms,
        vital_signs=body.vital_signs,
        allergies=body.allergies,
        triaged_by=body.triaged_by or current_user.name,
    )
    return {
        "id": case.id,
        "case_number": case.case_number,
        "triage_level": case.triage_level.value,
        "status": case.status.value,
    }


@router.get("/cases")
async def list_cases(
    status: Optional[EmergencyStatus] = None,
    triage_level: Optional[TriageLevel] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_emergency_cases(
        clinic_id=current_user.clinic_id,
        db=db,
        status=status,
        triage_level=triage_level,
        limit=limit,
    )


@router.get("/cases/{case_id}")
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmergencyCase).where(
            EmergencyCase.id == case_id,
            EmergencyCase.clinic_id == current_user.clinic_id,
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Emergency case not found")
    return {
        "id": case.id,
        "case_number": case.case_number,
        "triage_level": case.triage_level.value,
        "status": case.status.value,
        "patient_name": case.patient_name,
        "patient_phone": case.patient_phone,
        "age": case.age,
        "gender": case.gender,
        "chief_complaint": case.chief_complaint,
        "chief_complaint_bn": case.chief_complaint_bn,
        "symptoms": case.symptoms,
        "vital_signs": case.vital_signs,
        "allergies": case.allergies,
        "preliminary_diagnosis": case.preliminary_diagnosis,
        "treatment_notes": case.treatment_notes,
        "triaged_by": case.triaged_by,
        "treated_by": case.treated_by,
        "triaged_at": case.triaged_at.isoformat(),
        "disposition": case.disposition,
        "referral_hospital": case.referral_hospital,
    }


@router.patch("/cases/{case_id}/status")
async def update_case_status(
    case_id: str,
    status: EmergencyStatus = Query(...),
    treated_by: Optional[str] = None,
    disposition: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmergencyCase).where(
            EmergencyCase.id == case_id,
            EmergencyCase.clinic_id == current_user.clinic_id,
        )
    )
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.status = status
    if status == EmergencyStatus.IN_TREATMENT:
        case.treated_by = treated_by or current_user.name
        case.treated_at = datetime.utcnow()
    elif status in (EmergencyStatus.DISCHARGED, EmergencyStatus.DECEASED):
        case.discharged_at = datetime.utcnow()
        case.disposition = disposition

    await db.flush()
    return {"id": case.id, "case_number": case.case_number, "status": case.status.value}


@router.post("/ambulance")
async def dispatch_ambulance_endpoint(
    body: DispatchAmbulanceBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dispatch = await dispatch_ambulance(
        clinic_id=current_user.clinic_id,
        case_id=body.case_id,
        pickup_address=body.pickup_address,
        destination=body.destination,
        db=db,
        ambulance_id=body.ambulance_id,
        driver_name=body.driver_name,
        driver_phone=body.driver_phone,
        notes=body.notes,
    )
    return {
        "id": dispatch.id,
        "status": dispatch.status.value,
        "pickup_address": dispatch.pickup_address,
        "destination": dispatch.destination,
    }


@router.get("/ambulance")
async def list_ambulance_dispatches(
    status: Optional[AmbulanceStatus] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import and_
    conditions = [AmbulanceDispatch.clinic_id == current_user.clinic_id]
    if status:
        conditions.append(AmbulanceDispatch.status == status)
    query = select(AmbulanceDispatch).where(and_(*conditions)).order_by(AmbulanceDispatch.dispatched_at.desc()).limit(limit)
    result = await db.execute(query)
    dispatches = result.scalars().all()
    return [
        {
            "id": d.id,
            "case_id": d.case_id,
            "status": d.status.value,
            "driver_name": d.driver_name,
            "pickup_address": d.pickup_address,
            "destination": d.destination,
            "dispatched_at": d.dispatched_at.isoformat(),
        }
        for d in dispatches
    ]
