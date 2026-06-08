import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class SessionStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class TelemedicineSession(Base):
    __tablename__ = "telemedicine_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, default=20)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.SCHEDULED)

    meeting_url: Mapped[str] = mapped_column(String(500), nullable=True)
    room_name: Mapped[str] = mapped_column(String(255), nullable=True)
    provider: Mapped[str] = mapped_column(String(50), default="internal")

    patient_joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    doctor_joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    recording_url: Mapped[str] = mapped_column(String(500), nullable=True)
    recording_duration_sec: Mapped[int] = mapped_column(Integer, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<TelemedicineSession {self.id[:8]} — Dr.{self.doctor_id[:8]} ↔ Pt.{self.patient_id[:8]} [{self.status.value}]>"
