"""
models/advanced_appointments.py — Extended appointment models
Waiting list, recurring appointments, group bookings, questionnaires
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, JSON, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship
from db.base import Base


class WaitingListStatus(str, enum.Enum):
    WAITING = "waiting"
    NOTIFIED = "notified"
    BOOKED = "booked"
    EXPIRED = "expired"


class WaitingListEntry(Base):
    __tablename__ = "waiting_list"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    preferred_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    preferred_time_start: Mapped[str] = mapped_column(String(5), nullable=True)
    preferred_time_end: Mapped[str] = mapped_column(String(5), nullable=True)

    status: Mapped[WaitingListStatus] = mapped_column(
        Enum(WaitingListStatus), default=WaitingListStatus.WAITING, index=True
    )
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic: Mapped["Clinic"] = sa_relationship("Clinic")  # noqa: F821
    doctor: Mapped["Doctor"] = sa_relationship("Doctor")  # noqa: F821
    patient: Mapped["Patient"] = sa_relationship("Patient")  # noqa: F821

    def __repr__(self) -> str:
        return f"<WaitingList {self.id[:8]} — Dr.{self.doctor_id[:8]} on {self.preferred_date}>"


class RecurringAppointmentTemplate(Base):
    __tablename__ = "recurring_appointment_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    start_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    time_of_day: Mapped[str] = mapped_column(String(5), nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, default=20)

    frequency: Mapped[str] = mapped_column(String(20), nullable=False)
    interval: Mapped[int] = mapped_column(Integer, default=1)
    days_of_week: Mapped[dict] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic: Mapped["Clinic"] = sa_relationship("Clinic")  # noqa: F821
    doctor: Mapped["Doctor"] = sa_relationship("Doctor")  # noqa: F821
    patient: Mapped["Patient"] = sa_relationship("Patient")  # noqa: F821

    def __repr__(self) -> str:
        return f"<RecurringTemplate {self.id[:8]} — freq={self.frequency} at {self.time_of_day}>"


class GroupBooking(Base):
    __tablename__ = "group_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    primary_patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, default=30)
    slot_type: Mapped[str] = mapped_column(String(30), nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=5)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic: Mapped["Clinic"] = sa_relationship("Clinic")  # noqa: F821
    doctor: Mapped["Doctor"] = sa_relationship("Doctor")  # noqa: F821
    primary_patient: Mapped["Patient"] = sa_relationship("Patient", foreign_keys=[primary_patient_id])  # noqa: F821
    members = sa_relationship("GroupBookingMember", back_populates="booking_ref", lazy="select")

    def __repr__(self) -> str:
        return f"<GroupBooking {self.id[:8]} — {self.slot_type} ({self.max_members} max)>"


class GroupBookingMember(Base):
    __tablename__ = "group_booking_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("group_bookings.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    relationship_col: Mapped[str] = mapped_column("relationship", String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    booking_ref = sa_relationship("GroupBooking", back_populates="members")
    patient = sa_relationship("Patient")


class QuestionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    title_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    questions: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic: Mapped["Clinic"] = sa_relationship("Clinic")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Questionnaire {self.id[:8]} — {self.title}>"


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    questionnaire_id: Mapped[str] = mapped_column(String(36), ForeignKey("questionnaires.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    responses: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[QuestionStatus] = mapped_column(Enum(QuestionStatus), default=QuestionStatus.PENDING)
    submitted_via: Mapped[str] = mapped_column(String(20), default="voice")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    questionnaire: Mapped["Questionnaire"] = sa_relationship("Questionnaire")  # noqa: F821
    appointment: Mapped["Appointment"] = sa_relationship("Appointment")  # noqa: F821
    patient: Mapped["Patient"] = sa_relationship("Patient")  # noqa: F821

    def __repr__(self) -> str:
        return f"<QuestionnaireResponse {self.id[:8]} — status={self.status}>"
