import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Date, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class VitalSignUnit(str, enum.Enum):
    MMHG = "mmHg"
    BPM = "bpm"
    CELSIUS = "celsius"
    KG = "kg"
    CM = "cm"
    PERCENT = "%"
    MG_DL = "mg/dL"


class AllergySeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    LIFE_THREATENING = "life_threatening"


class DiagnosisType(str, enum.Enum):
    PRIMARY = "primary"
    SECONDARY = "secondary"
    DIFFERENTIAL = "differential"
    RULED_OUT = "ruled_out"


class VisitType(str, enum.Enum):
    NEW = "new"
    FOLLOW_UP = "follow_up"
    EMERGENCY = "emergency"
    ROUTINE_CHECKUP = "routine_checkup"
    TELEMEDICINE = "telemedicine"
    HOME_VISIT = "home_visit"


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)

    visit_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    visit_type: Mapped[VisitType] = mapped_column(Enum(VisitType), nullable=False)
    chief_complaint: Mapped[str] = mapped_column(Text, nullable=True)
    chief_complaint_bn: Mapped[str] = mapped_column(Text, nullable=True)
    history_of_present_illness: Mapped[str] = mapped_column(Text, nullable=True)
    assessment: Mapped[str] = mapped_column(Text, nullable=True)
    plan: Mapped[str] = mapped_column(Text, nullable=True)
    clinical_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<MedicalRecord {self.id[:8]} — {self.visit_date} [{self.visit_type.value}]>"


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id"), nullable=False, index=True)

    parameter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[VitalSignUnit] = mapped_column(Enum(VitalSignUnit), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<VitalSign {self.parameter_name}: {self.value} {self.unit.value}>"


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id"), nullable=False, index=True)

    diagnosis_name: Mapped[str] = mapped_column(String(500), nullable=False)
    diagnosis_name_bn: Mapped[str] = mapped_column(String(500), nullable=True)
    icd_code: Mapped[str] = mapped_column(String(20), nullable=True)
    diagnosis_type: Mapped[DiagnosisType] = mapped_column(Enum(DiagnosisType), default=DiagnosisType.PRIMARY)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Diagnosis {self.icd_code or ''} {self.diagnosis_name[:50]}>"


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id"), nullable=False, index=True)
    inventory_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory_items.id"), nullable=True)

    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    medicine_name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    frequency: Mapped[str] = mapped_column(String(100), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=True)
    route: Mapped[str] = mapped_column(String(50), default="oral")
    instructions: Mapped[str] = mapped_column(Text, nullable=True)
    instructions_bn: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Prescription {self.medicine_name} — {self.dosage} {self.frequency}>"


class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id"), nullable=True, index=True)

    allergen: Mapped[str] = mapped_column(String(255), nullable=False)
    allergen_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    severity: Mapped[AllergySeverity] = mapped_column(Enum(AllergySeverity), default=AllergySeverity.MILD)
    reaction: Mapped[str] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Allergy {self.allergen} [{self.severity.value}]>"


class Immunization(Base):
    __tablename__ = "immunizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    record_id: Mapped[str] = mapped_column(String(36), ForeignKey("medical_records.id"), nullable=True, index=True)

    vaccine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vaccine_name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    dose_number: Mapped[int] = mapped_column(Integer, nullable=True)
    administered_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    next_due_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    administered_by: Mapped[str] = mapped_column(String(255), nullable=True)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Immunization {self.vaccine_name} dose {self.dose_number or '?'} — {self.administered_date}>"


class FamilyHistory(Base):
    __tablename__ = "family_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    relationship: Mapped[str] = mapped_column(String(50), nullable=False)
    condition: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<FamilyHistory {self.relationship}: {self.condition}>"
