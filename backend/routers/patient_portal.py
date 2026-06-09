"""
routers/patient_portal.py — Patient self-service auth + data endpoints.
"""
import random
import string
import structlog
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.patient import Patient
from models.appointment import Appointment
from config import get_settings
from services.sms_service import send_sms

router = APIRouter()
logger = structlog.get_logger()
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RequestOTPBody(BaseModel):
    phone: str


class VerifyOTPBody(BaseModel):
    phone: str
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    patient: dict


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=settings.otp_length))


def _create_patient_jwt(patient_id: str, clinic_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiry_hours)
    payload = {
        "sub": patient_id,
        "clinic_id": clinic_id,
        "role": "patient",
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

_bearer = HTTPBearer()


async def get_current_patient(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> Patient:
    payload = _verify_jwt(credentials.credentials)
    if payload.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Not a patient token")
    result = await db.execute(select(Patient).where(Patient.id == payload["sub"], Patient.is_active == True))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=401, detail="Patient not found")
    return patient


@router.post("/patient-portal/request-otp")
async def request_otp(body: RequestOTPBody, db: AsyncSession = Depends(get_db)):
    """Send OTP to patient phone for portal login."""
    result = await db.execute(select(Patient).where(Patient.phone == body.phone, Patient.is_active == True))
    patient = result.scalar_one_or_none()

    if not patient:
        return {"message": "If this number is registered, an OTP will be sent."}

    otp = _generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.otp_expiry_minutes)

    patient.otp_hash = pwd_context.hash(otp)
    patient.otp_expires_at = expires_at
    await db.flush()

    msg = f"Your Shasthya Seba portal OTP: {otp}\nExpires in {settings.otp_expiry_minutes} minutes."
    sent = await send_sms(body.phone, msg)

    if not sent and settings.app_env == "development":
        logger.warning("SMS not configured — OTP for dev use", otp=otp, phone=body.phone[-4:])

    logger.info("Patient portal OTP sent", phone=body.phone[-4:])
    return {"message": "OTP sent."}


@router.post("/patient-portal/verify-otp", response_model=TokenResponse)
async def verify_otp(body: VerifyOTPBody, db: AsyncSession = Depends(get_db)):
    """Verify patient OTP and return JWT."""
    result = await db.execute(select(Patient).where(Patient.phone == body.phone, Patient.is_active == True))
    patient = result.scalar_one_or_none()

    if not patient or not patient.otp_hash or not patient.otp_expires_at:
        raise HTTPException(status_code=400, detail="Invalid request.")

    if datetime.utcnow() > patient.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired. Try again.")

    if not pwd_context.verify(body.otp, patient.otp_hash):
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    patient.otp_hash = None
    patient.otp_expires_at = None
    await db.flush()

    token = _create_patient_jwt(patient.id, patient.clinic_id)

    return TokenResponse(
        access_token=token,
        patient={
            "id": patient.id,
            "name": patient.name,
            "name_bn": patient.name_bn,
            "phone": patient.phone,
            "clinic_id": patient.clinic_id,
            "preferred_language": patient.preferred_language,
        },
    )


@router.get("/patient-portal/me")
async def get_me(current_patient: Patient = Depends(get_current_patient)):
    return {
        "id": current_patient.id,
        "name": current_patient.name,
        "name_bn": current_patient.name_bn,
        "phone": current_patient.phone,
        "gender": current_patient.gender,
        "date_of_birth": current_patient.date_of_birth.isoformat() if current_patient.date_of_birth else None,
        "address": current_patient.address,
        "preferred_language": current_patient.preferred_language,
    }


@router.get("/patient-portal/appointments")
async def get_my_appointments(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
):
    conditions = [Appointment.patient_id == current_patient.id]
    if status_filter:
        conditions.append(Appointment.status == status_filter)

    from sqlalchemy import and_
    from models.appointment import Appointment

    result = await db.execute(
        select(Appointment)
        .where(and_(*conditions))
        .order_by(Appointment.appointment_date.desc())
        .limit(50)
    )
    appointments = result.scalars().all()

    from models.doctor import Doctor

    doctor_ids = list({a.doctor_id for a in appointments})
    doc_result = await db.execute(select(Doctor).where(Doctor.id.in_(doctor_ids)))
    doctors = {d.id: d for d in doc_result.scalars().all()}

    return [
        {
            "id": a.id,
            "appointment_date": a.appointment_date.isoformat() if a.appointment_date else None,
            "appointment_time": a.appointment_time,
            "status": a.status.value,
            "payment_status": a.payment_status.value,
            "fee": a.fee,
            "doctor_name": doctors[a.doctor_id].name if a.doctor_id in doctors else None,
            "doctor_specialty": doctors[a.doctor_id].specialty if a.doctor_id in doctors else None,
            "created_at": a.created_at.isoformat(),
        }
        for a in appointments
    ]


@router.get("/patient-portal/invoices")
async def get_my_invoices(
    db: AsyncSession = Depends(get_db),
    current_patient: Patient = Depends(get_current_patient),
):
    from models.payment import Invoice
    from sqlalchemy import select

    from models.appointment import Appointment

    # Get patient's appointments to match invoices
    appt_result = await db.execute(
        select(Appointment).where(Appointment.patient_id == current_patient.id)
    )
    appt_ids = [a.id for a in appt_result.scalars().all()]

    if not appt_ids:
        return []

    result = await db.execute(
        select(Invoice).where(Invoice.appointment_id.in_(appt_ids)).order_by(Invoice.issued_at.desc())
    )
    invoices = result.scalars().all()

    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "status": inv.status.value,
            "subtotal": inv.subtotal,
            "tax": inv.tax,
            "discount": inv.discount,
            "total": inv.total,
            "issued_at": inv.issued_at.isoformat() if inv.issued_at else None,
            "due_at": inv.due_at.isoformat() if inv.due_at else None,
        }
        for inv in invoices
    ]
