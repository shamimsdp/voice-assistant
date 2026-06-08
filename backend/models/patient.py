"""
models/patient.py — Patient ORM model
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    date_of_birth: Mapped[datetime] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=True)   # male / female / other
    address: Mapped[str] = mapped_column(Text, nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)

    # Preferred language detected from calls
    preferred_language: Mapped[str] = mapped_column(String(10), default="bn-BD")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic = relationship("Clinic", back_populates="patients")
    appointments: Mapped[list["Appointment"]] = relationship(  # noqa: F821
        "Appointment", back_populates="patient", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<Patient {self.name} ({self.phone})>"
