"""
routers/clinics.py — Clinic management API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.base import get_db
from models.clinic import Clinic
from models.doctor import Doctor
from routers.auth import get_current_user
from models.user import User, UserRole

router = APIRouter()


class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    name_bn: Optional[str] = None
    address: Optional[str] = None
    address_bn: Optional[str] = None
    working_hours: Optional[dict] = None
    bkash_merchant_number: Optional[str] = None


class DoctorCreate(BaseModel):
    name: str
    name_bn: Optional[str] = None
    specialty: Optional[str] = None
    specialty_bn: Optional[str] = None
    qualification: Optional[str] = None
    phone: Optional[str] = None
    consultation_fee: int = 500
    slot_duration_minutes: int = 20
    available_slots: Optional[dict] = None


@router.get("/me")
async def get_my_clinic(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Clinic).where(Clinic.id == current_user.clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return {
        "id": clinic.id,
        "name": clinic.name,
        "name_bn": clinic.name_bn,
        "phone": clinic.phone,
        "address": clinic.address,
        "address_bn": clinic.address_bn,
        "district": clinic.district,
        "working_hours": clinic.working_hours,
        "bkash_merchant_number": clinic.bkash_merchant_number,
        "twilio_number": clinic.twilio_number,
    }


@router.patch("/me")
async def update_my_clinic(
    body: ClinicUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(select(Clinic).where(Clinic.id == current_user.clinic_id))
    clinic = result.scalar_one_or_none()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(clinic, field, value)

    await db.flush()
    return {"message": "Clinic updated"}


@router.get("/doctors")
async def list_doctors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Doctor).where(Doctor.clinic_id == current_user.clinic_id, Doctor.is_active == True)
    )
    doctors = result.scalars().all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "name_bn": d.name_bn,
            "specialty": d.specialty,
            "specialty_bn": d.specialty_bn,
            "consultation_fee": d.consultation_fee,
            "slot_duration_minutes": d.slot_duration_minutes,
            "available_slots": d.available_slots,
        }
        for d in doctors
    ]


@router.post("/doctors", status_code=201)
async def add_doctor(
    body: DoctorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in (UserRole.ADMIN,):
        raise HTTPException(status_code=403, detail="Admin access required")

    doctor = Doctor(
        clinic_id=current_user.clinic_id,
        **body.model_dump(),
    )
    db.add(doctor)
    await db.flush()
    return {"id": doctor.id, "name": doctor.name}


@router.delete("/doctors/{doctor_id}", status_code=204)
async def deactivate_doctor(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Doctor).where(Doctor.id == doctor_id, Doctor.clinic_id == current_user.clinic_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor.is_active = False
