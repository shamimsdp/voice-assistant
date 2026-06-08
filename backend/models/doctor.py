"""
models/doctor.py — Doctor ORM model
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)   # ডাঃ করিম
    specialty: Mapped[str] = mapped_column(String(255), nullable=True)
    specialty_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    qualification: Mapped[str] = mapped_column(String(500), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Available slots: {"mon": ["09:00", "09:30", "10:00", ...], "tue": [...]}
    available_slots: Mapped[dict] = mapped_column(JSON, nullable=True)

    # Appointment duration in minutes
    slot_duration_minutes: Mapped[int] = mapped_column(default=20)

    # Consultation fee in BDT
    consultation_fee: Mapped[int] = mapped_column(default=500)

    # Symptom keywords for automatic doctor matching: ["chest pain", "fever", "cough", ...]
    symptom_keywords: Mapped[dict] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="doctors")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="doctor", lazy="select")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Doctor {self.name} — {self.specialty}>"
