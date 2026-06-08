import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class TriageLevel(str, enum.Enum):
    RESUSCITATION = "resuscitation"
    EMERGENCY = "emergency"
    URGENT = "urgent"
    SEMI_URGENT = "semi_urgent"
    NON_URGENT = "non_urgent"


class EmergencyStatus(str, enum.Enum):
    TRIAGED = "triaged"
    IN_TREATMENT = "in_treatment"
    ADMITTED = "admitted"
    TRANSFERRED = "transferred"
    DISCHARGED = "discharged"
    DECEASED = "deceased"


class AmbulanceStatus(str, enum.Enum):
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ARRIVED = "arrived"
    AT_HOSPITAL = "at_hospital"
    AVAILABLE = "available"


class EmergencyCase(Base):
    __tablename__ = "emergency_cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=True, index=True)

    case_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    triage_level: Mapped[TriageLevel] = mapped_column(Enum(TriageLevel), nullable=False)
    status: Mapped[EmergencyStatus] = mapped_column(Enum(EmergencyStatus), default=EmergencyStatus.TRIAGED)

    patient_name: Mapped[str] = mapped_column(String(255), nullable=True)
    patient_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=True)
    chief_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    chief_complaint_bn: Mapped[str] = mapped_column(Text, nullable=True)
    symptoms: Mapped[dict] = mapped_column(JSON, nullable=True)
    vital_signs: Mapped[dict] = mapped_column(JSON, nullable=True)
    allergies: Mapped[str] = mapped_column(Text, nullable=True)
    preliminary_diagnosis: Mapped[str] = mapped_column(Text, nullable=True)
    treatment_notes: Mapped[str] = mapped_column(Text, nullable=True)

    triaged_by: Mapped[str] = mapped_column(String(255), nullable=True)
    treated_by: Mapped[str] = mapped_column(String(255), nullable=True)
    triaged_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    treated_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    discharged_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    disposition: Mapped[str] = mapped_column(String(100), nullable=True)
    referral_hospital: Mapped[str] = mapped_column(String(255), nullable=True)
    referral_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<EmergencyCase {self.case_number} — {self.triage_level.value} [{self.status.value}]>"


class AmbulanceDispatch(Base):
    __tablename__ = "ambulance_dispatches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("emergency_cases.id"), nullable=False, index=True)

    ambulance_id: Mapped[str] = mapped_column(String(100), nullable=True)
    driver_name: Mapped[str] = mapped_column(String(255), nullable=True)
    driver_phone: Mapped[str] = mapped_column(String(20), nullable=True)

    pickup_address: Mapped[str] = mapped_column(Text, nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[AmbulanceStatus] = mapped_column(Enum(AmbulanceStatus), default=AmbulanceStatus.DISPATCHED)

    dispatched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    arrived_at_pickup: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    arrived_at_destination: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<AmbulanceDispatch {self.id[:8]} — {self.pickup_address[:40]} → {self.destination[:20]} [{self.status.value}]>"
