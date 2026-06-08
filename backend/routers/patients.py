"""
routers/patients.py — Patient CRUD API
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional

from db.base import get_db
from models.patient import Patient
from models.appointment import Appointment
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


class PatientCreate(BaseModel):
    phone: str
    name: Optional[str] = None
    name_bn: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class PatientUpdate(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    name_bn: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None


class PatientResponse(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    name_bn: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    preferred_language: str
    is_active: bool
    created_at: str
    appointment_count: int = 0

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None, description="Search by name or phone"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Patient).where(Patient.clinic_id == current_user.clinic_id)

    if search:
        query = query.where(
            or_(
                Patient.name.ilike(f"%{search}%"),
                Patient.phone.ilike(f"%{search}%"),
                Patient.name_bn.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(Patient.created_at.desc())
    result = await db.execute(query)
    patients = result.scalars().all()

    resp = []
    for p in patients:
        appt_count = await db.execute(
            select(Appointment).where(
                Appointment.patient_id == p.id,
                Appointment.clinic_id == current_user.clinic_id,
            )
        )
        data = PatientResponse.model_validate(p)
        data.appointment_count = len(appt_count.scalars().all())
        resp.append(data)
    return resp


@router.post("/", response_model=PatientResponse, status_code=201)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(Patient).where(
            Patient.phone == body.phone,
            Patient.clinic_id == current_user.clinic_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Patient with this phone already exists")

    patient = Patient(clinic_id=current_user.clinic_id, **body.model_dump())
    db.add(patient)
    await db.flush()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.clinic_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    appt_count = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient.id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    data = PatientResponse.model_validate(patient)
    data.appointment_count = len(appt_count.scalars().all())
    return data


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.clinic_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(patient, key, val)
    await db.flush()
    await db.refresh(patient)

    appt_count = await db.execute(
        select(Appointment).where(
            Appointment.patient_id == patient.id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    data = PatientResponse.model_validate(patient)
    data.appointment_count = len(appt_count.scalars().all())
    return data


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.clinic_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.is_active = False
    await db.flush()
    return {"message": "Patient deactivated"}
