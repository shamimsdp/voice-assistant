import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class DispenseStatus(str, enum.Enum):
    PENDING = "pending"
    DISPENSED = "dispensed"
    PARTIALLY_DISPENSED = "partially_dispensed"
    CANCELLED = "cancelled"


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    FAILED = "failed"


class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[str] = mapped_column(String(36), ForeignKey("doctors.id"), nullable=True, index=True)
    prescription_id: Mapped[str] = mapped_column(String(36), ForeignKey("prescriptions.id"), nullable=True, index=True)

    order_number: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    dispense_status: Mapped[DispenseStatus] = mapped_column(Enum(DispenseStatus), default=DispenseStatus.PENDING)
    delivery_status: Mapped[DeliveryStatus] = mapped_column(Enum(DeliveryStatus), nullable=True)

    total_amount: Mapped[int] = mapped_column(Integer, default=0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)

    delivery_address: Mapped[str] = mapped_column(Text, nullable=True)
    delivery_fee: Mapped[int] = mapped_column(Integer, default=0)
    delivery_partner: Mapped[str] = mapped_column(String(100), nullable=True)
    estimated_delivery_min: Mapped[int] = mapped_column(Integer, nullable=True)

    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<PharmacyOrder {self.order_number} [{self.dispense_status.value}]>"


class PharmacyOrderItem(Base):
    __tablename__ = "pharmacy_order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("pharmacy_orders.id"), nullable=False, index=True)
    inventory_item_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory_items.id"), nullable=True)

    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str] = mapped_column(String(100), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, default=0)
    total_price: Mapped[int] = mapped_column(Integer, default=0)

    is_dispensed: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<PharmacyOrderItem {self.medicine_name} x{self.quantity}>"
