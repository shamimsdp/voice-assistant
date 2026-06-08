import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, Boolean, DateTime, Integer, Text, ForeignKey, Enum, Float, Date
from sqlalchemy.orm import Mapped, mapped_column
from db.base import Base


class MedicineCategory(str, enum.Enum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    INJECTION = "injection"
    CREAM = "cream"
    DROP = "drop"
    INHALER = "inhaler"
    SUPPLEMENT = "supplement"
    OTHER = "other"


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    RETURN = "return"
    ADJUSTMENT = "adjustment"
    EXPIRED = "expired"
    DAMAGED = "damaged"


class StockAlertLevel(str, enum.Enum):
    NORMAL = "normal"
    LOW = "low"
    CRITICAL = "critical"
    OUT_OF_STOCK = "out_of_stock"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    category: Mapped[MedicineCategory] = mapped_column(Enum(MedicineCategory), nullable=False)
    generic_name: Mapped[str] = mapped_column(String(255), nullable=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)

    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=10)
    max_stock: Mapped[int] = mapped_column(Integer, default=100)
    unit_price: Mapped[int] = mapped_column(Integer, default=0)
    selling_price: Mapped[int] = mapped_column(Integer, default=0)

    expiry_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    batch_number: Mapped[str] = mapped_column(String(100), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=True)
    requires_prescription: Mapped[bool] = mapped_column(Boolean, default=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def alert_level(self) -> StockAlertLevel:
        if self.current_stock <= 0:
            return StockAlertLevel.OUT_OF_STOCK
        if self.current_stock <= self.min_stock * 0.25:
            return StockAlertLevel.CRITICAL
        if self.current_stock <= self.min_stock:
            return StockAlertLevel.LOW
        return StockAlertLevel.NORMAL

    def __repr__(self) -> str:
        return f"<InventoryItem {self.name} ({self.current_stock} {self.unit})>"


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("inventory_items.id"), nullable=False, index=True)

    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=True)
    total_amount: Mapped[int] = mapped_column(Integer, nullable=True)

    reference_type: Mapped[str] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[str] = mapped_column(String(36), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    performed_by: Mapped[str] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<InventoryTransaction {self.transaction_type.value} x{self.quantity} — {self.item_id[:8]}>"


class MedicalSupply(Base):
    __tablename__ = "medical_supplies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    supply_type: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=5)
    unit_price: Mapped[int] = mapped_column(Integer, default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<MedicalSupply {self.name} ({self.current_stock} {self.unit})>"


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    clinic_id: Mapped[str] = mapped_column(String(36), ForeignKey("clinics.id"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_bn: Mapped[str] = mapped_column(String(255), nullable=True)
    equipment_type: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), nullable=True)
    model: Mapped[str] = mapped_column(String(255), nullable=True)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=True)

    purchase_date: Mapped[datetime] = mapped_column(Date, nullable=True)
    warranty_expiry: Mapped[datetime] = mapped_column(Date, nullable=True)
    last_maintenance: Mapped[datetime] = mapped_column(Date, nullable=True)
    next_maintenance: Mapped[datetime] = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="operational")
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Equipment {self.name} [{self.status}]>"
