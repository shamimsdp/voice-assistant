"""
models/clinic.py — Clinic ORM model
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)   # Bangla name
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    address_bn: Mapped[str] = mapped_column(Text, nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=True, default="Dhaka")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Working hours stored as JSON: {"mon": ["09:00", "18:00"], ...}
    working_hours: Mapped[dict] = mapped_column(JSON, nullable=True)

    # bKash merchant number for payment collection
    bkash_merchant_number: Mapped[str] = mapped_column(String(20), nullable=True)

    # Twilio number assigned to this clinic
    twilio_number: Mapped[str] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    doctors: Mapped[list["Doctor"]] = relationship("Doctor", back_populates="clinic", lazy="select")  # noqa: F821
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="clinic", lazy="select")  # noqa: F821
    call_logs: Mapped[list["CallLog"]] = relationship("CallLog", back_populates="clinic", lazy="select")  # noqa: F821
    users: Mapped[list["User"]] = relationship("User", back_populates="clinic", lazy="select")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Clinic {self.name} ({self.phone})>"
