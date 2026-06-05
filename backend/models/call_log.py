"""
models/call_log.py — CallLog ORM model
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Text, ForeignKey, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base


class CallStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED   = "completed"
    FAILED      = "failed"
    NO_ANSWER   = "no_answer"


class CallLog(Base):
    __tablename__ = "call_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str]  = mapped_column(String(36), ForeignKey("clinics.id"),  nullable=True, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=True, index=True)

    # Twilio call info
    twilio_call_sid: Mapped[str] = mapped_column(String(100), nullable=True, unique=True, index=True)
    caller_phone: Mapped[str]    = mapped_column(String(20),  nullable=False)
    direction: Mapped[str]       = mapped_column(String(10),  default="inbound")   # inbound / outbound

    status: Mapped[CallStatus] = mapped_column(Enum(CallStatus), default=CallStatus.IN_PROGRESS)

    # Timing
    started_at: Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime]    = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)

    # Language detected during call
    detected_language: Mapped[str] = mapped_column(String(10), default="bn-BD")

    # Full transcript (JSON-serialised list of {role, text, timestamp})
    transcript: Mapped[str] = mapped_column(Text, nullable=True)

    # Outcome
    appointment_booked: Mapped[bool] = mapped_column(default=False)
    appointment_id: Mapped[str]      = mapped_column(String(36), nullable=True)

    # AI quality metrics
    stt_confidence: Mapped[float] = mapped_column(Float, nullable=True)
    llm_tokens_used: Mapped[int]  = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    clinic:  Mapped["Clinic"]  = relationship("Clinic",  back_populates="call_logs")  # noqa: F821
    patient: Mapped["Patient"] = relationship("Patient", back_populates=None)          # noqa: F821

    def __repr__(self) -> str:
        return f"<CallLog {self.twilio_call_sid} — {self.caller_phone} [{self.status}]>"
