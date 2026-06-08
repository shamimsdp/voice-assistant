"""
models/payment.py — Invoice & Insurance claim ORM models
"""
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class InvoiceStatus(str, enum.Enum):
    DRAFT    = "draft"
    SENT     = "sent"
    PAID     = "paid"
    OVERDUE  = "overdue"
    CANCELLED = "cancelled"


class InsuranceProvider(str, enum.Enum):
    PRAGOTI = "pragoti_life"
    METLIFE = "metlife_bd"
    DELTA   = "delta_life"
    GENERAL = "general"
    OTHER   = "other"


class ClaimStatus(str, enum.Enum):
    DRAFT      = "draft"
    SUBMITTED  = "submitted"
    APPROVED   = "approved"
    REJECTED   = "rejected"
    PAID       = "paid"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)

    invoice_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    status: Mapped[InvoiceStatus] = mapped_column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)

    # Line items stored as JSON: [{"description": "...", "amount": 500}]
    line_items: Mapped[dict] = mapped_column(JSON, nullable=True)

    subtotal: Mapped[int] = mapped_column(Integer, default=0)
    tax_pct: Mapped[float] = mapped_column(Float, default=0.0)
    tax_amount: Mapped[int] = mapped_column(Integer, default=0)
    discount: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)

    issued_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    due_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    appointment_id: Mapped[str] = mapped_column(String(36), ForeignKey("appointments.id"), nullable=False)

    provider: Mapped[InsuranceProvider] = mapped_column(Enum(InsuranceProvider), nullable=False)
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    claim_amount: Mapped[int] = mapped_column(Integer, default=0)
    approved_amount: Mapped[int] = mapped_column(Integer, nullable=True)
    status: Mapped[ClaimStatus] = mapped_column(Enum(ClaimStatus), default=ClaimStatus.DRAFT)

    diagnosis_code: Mapped[str] = mapped_column(String(20), nullable=True)
    treatment_code: Mapped[str] = mapped_column(String(20), nullable=True)

    submitted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    responded_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
