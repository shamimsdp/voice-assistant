"""
models/appointment.py — Appointment ORM model
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class AppointmentStatus(str, enum.Enum):
    PENDING   = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW   = "no_show"


class PaymentStatus(str, enum.Enum):
    UNPAID    = "unpaid"
    INITIATED = "initiated"
    PAID      = "paid"
    REFUNDED  = "refunded"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str]  = mapped_column(String(36), ForeignKey("clinics.id"),  nullable=False, index=True)
    doctor_id: Mapped[str]  = mapped_column(String(36), ForeignKey("doctors.id"),  nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    scheduled_at: Mapped[datetime]  = mapped_column(DateTime, nullable=False, index=True)
    duration_min: Mapped[int]       = mapped_column(Integer, default=20)

    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.PENDING
    )

    # Payment
    consultation_fee: Mapped[int]      = mapped_column(Integer, default=0)   # BDT
    advance_amount: Mapped[int]        = mapped_column(Integer, default=0)   # BDT deposit
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.UNPAID
    )
    bkash_payment_id: Mapped[str] = mapped_column(String(100), nullable=True)
    bkash_trx_id: Mapped[str]     = mapped_column(String(100), nullable=True)

    # Notes from voice call
    notes: Mapped[str]    = mapped_column(Text, nullable=True)
    notes_bn: Mapped[str] = mapped_column(Text, nullable=True)

    # Reminders
    sms_sent: Mapped[bool]      = mapped_column(Boolean, default=False)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    clinic:  Mapped["Clinic"]  = relationship("Clinic",  back_populates="appointments")  # noqa: F821
    doctor:  Mapped["Doctor"]  = relationship("Doctor",  back_populates="appointments")  # noqa: F821
    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Appointment {self.id[:8]} — {self.scheduled_at} [{self.status}]>"
