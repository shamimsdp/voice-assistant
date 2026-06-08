import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Float, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class LabTestCategory(str, enum.Enum):
    BLOOD = "blood"
    URINE = "urine"
    STOOL = "stool"
    IMAGING = "imaging"
    CARDIOLOGY = "cardiology"
    MICROBIOLOGY = "microbiology"
    PATHOLOGY = "pathology"
    OTHER = "other"


class SpecimenType(str, enum.Enum):
    BLOOD = "blood"
    URINE = "urine"
    STOOL = "stool"
    SPUTUM = "sputum"
    SWAB = "swab"
    TISSUE = "tissue"
    CSF = "csf"
    OTHER = "other"


class OrderStatus(str, enum.Enum):
    ORDERED = "ordered"
    SPECIMEN_COLLECTED = "specimen_collected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ABNORMAL = "abnormal"


class LabTest(Base):
    __tablename__ = "lab_tests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    category: Mapped[LabTestCategory] = mapped_column(Enum(LabTestCategory), nullable=False)
    specimen_type: Mapped[SpecimenType] = mapped_column(Enum(SpecimenType), nullable=False)

    fee: Mapped[int] = mapped_column(Integer, default=0)
    turnaround_hours: Mapped[int] = mapped_column(Integer, default=24)
    preparation_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    preparation_instructions_bn: Mapped[str] = mapped_column(Text, nullable=True)

    reference_ranges: Mapped[dict] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LabTest {self.name} ({self.category.value})>"


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)

    order_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.ORDERED)
    priority: Mapped[str] = mapped_column(String(20), default="routine")

    clinical_notes: Mapped[str] = mapped_column(Text, nullable=True)
    diagnosis_code: Mapped[str] = mapped_column(String(20), nullable=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    total_fee: Mapped[int] = mapped_column(Integer, default=0)

    specimen_id: Mapped[str] = mapped_column(String(100), nullable=True)
    specimen_collected_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    collected_by: Mapped[str] = mapped_column(String(255), nullable=True)

    ordered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LabOrder {self.order_number} — {self.status.value}>"


class LabResult(Base):
    __tablename__ = "lab_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("lab_orders.id"), nullable=False, index=True)
    test_id: Mapped[str] = mapped_column(String(36), ForeignKey("lab_tests.id"), nullable=False, index=True)

    parameter_name: Mapped[str] = mapped_column(String(255), nullable=False)
    parameter_name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    result_value: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=True)
    reference_range: Mapped[str] = mapped_column(String(255), nullable=True)
    is_abnormal: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[str] = mapped_column(Text, nullable=True)
    performed_by: Mapped[str] = mapped_column(String(255), nullable=True)
    verified_by: Mapped[str] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<LabResult {self.parameter_name}: {self.result_value} {self.unit or ''}>"


class ImagingStudy(Base):
    __tablename__ = "imaging_studies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=True, index=True)

    study_type: Mapped[str] = mapped_column(String(100), nullable=False)
    body_part: Mapped[str] = mapped_column(String(100), nullable=False)
    clinical_reason: Mapped[str] = mapped_column(Text, nullable=True)
    findings: Mapped[str] = mapped_column(Text, nullable=True)
    impression: Mapped[str] = mapped_column(Text, nullable=True)
    radiologist_notes: Mapped[str] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="ordered")
    fee: Mapped[int] = mapped_column(Integer, default=0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)

    image_urls: Mapped[dict] = mapped_column(JSON, nullable=True)
    report_url: Mapped[str] = mapped_column(String(500), nullable=True)

    ordered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    performed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    reported_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<ImagingStudy {self.study_type} — {self.body_part} [{self.status}]>"
