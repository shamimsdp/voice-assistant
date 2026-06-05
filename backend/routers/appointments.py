"""
routers/appointments.py — Appointment CRUD API
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional

from db.base import get_db
from models.appointment import Appointment, AppointmentStatus
from models.patient import Patient
from models.doctor import Doctor
from routers.auth import get_current_user
from models.user import User
from utils.prayer_times import should_avoid_scheduling

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────
class AppointmentCreate(BaseModel):
    doctor_id: str
    patient_name: str
    patient_phone: str
    scheduled_at: datetime
    notes: Optional[str] = None
    advance_amount: int = 0


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/")
async def list_appointments(
    date: Optional[str] = Query(None, description="Filter by date YYYY-MM-DD"),
    status: Optional[AppointmentStatus] = None,
    doctor_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List appointments for the current user's clinic."""
    query = select(Appointment).where(Appointment.clinic_id == current_user.clinic_id)

    if status:
        query = query.where(Appointment.status == status)
    if doctor_id:
        query = query.where(Appointment.doctor_id == doctor_id)
    if date:
        day = datetime.strptime(date, "%Y-%m-%d")
        next_day = day.replace(hour=23, minute=59, second=59)
        query = query.where(
            and_(Appointment.scheduled_at >= day, Appointment.scheduled_at <= next_day)
        )

    query = query.order_by(Appointment.scheduled_at)
    result = await db.execute(query)
    appointments = result.scalars().all()

    return [
        {
            "id": a.id,
            "scheduled_at": a.scheduled_at.isoformat(),
            "status": a.status.value,
            "payment_status": a.payment_status.value,
            "consultation_fee": a.consultation_fee,
            "advance_amount": a.advance_amount,
            "notes": a.notes,
            "doctor_id": a.doctor_id,
            "patient_id": a.patient_id,
        }
        for a in appointments
    ]


@router.post("/", status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually create an appointment from the dashboard."""
    # Check scheduling constraints
    avoid, reason = should_avoid_scheduling(body.scheduled_at)
    if avoid:
        raise HTTPException(status_code=400, detail=f"Cannot schedule at this time: {reason}")

    # Get or create patient
    result = await db.execute(select(Patient).where(Patient.phone == body.patient_phone))
    patient = result.scalar_one_or_none()
    if not patient:
        patient = Patient(phone=body.patient_phone, name=body.patient_name)
        db.add(patient)
        await db.flush()

    # Get doctor
    doc_result = await db.execute(select(Doctor).where(Doctor.id == body.doctor_id))
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    appt = Appointment(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        patient_id=patient.id,
        scheduled_at=body.scheduled_at,
        consultation_fee=doctor.consultation_fee,
        advance_amount=body.advance_amount,
        notes=body.notes,
        status=AppointmentStatus.CONFIRMED,
    )
    db.add(appt)
    await db.flush()

    return {"id": appt.id, "status": appt.status.value, "scheduled_at": appt.scheduled_at.isoformat()}


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")

    if body.status:
        appt.status = body.status
    if body.scheduled_at:
        appt.scheduled_at = body.scheduled_at
    if body.notes is not None:
        appt.notes = body.notes

    await db.flush()
    return {"id": appt.id, "status": appt.status.value}


@router.delete("/{appointment_id}", status_code=204)
async def cancel_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")

    appt.status = AppointmentStatus.CANCELLED
