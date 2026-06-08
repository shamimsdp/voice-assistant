import structlog
from datetime import datetime, date
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from models.clinic_operations import (
    InventoryItem, InventoryTransaction, MedicalSupply, Equipment,
    MedicineCategory, TransactionType, StockAlertLevel,
)

logger = structlog.get_logger()


async def get_inventory_summary(
    clinic_id: str,
    db: AsyncSession,
    category: Optional[MedicineCategory] = None,
    alert_level: Optional[StockAlertLevel] = None,
) -> Dict:
    """Get inventory summary with counts by category and alert level."""
    query = select(InventoryItem).where(
        InventoryItem.clinic_id == clinic_id,
        InventoryItem.is_active == True,
    )
    if category:
        query = query.where(InventoryItem.category == category)

    result = await db.execute(query)
    items = result.scalars().all()

    total_items = len(items)
    total_stock = sum(i.current_stock for i in items)
    total_value = sum(i.current_stock * i.unit_price for i in items)

    by_alert = {level: [] for level in StockAlertLevel}
    for item in items:
        by_alert[item.alert_level].append(item)

    if alert_level:
        items = by_alert.get(alert_level, [])

    return {
        "total_items": total_items,
        "total_stock_units": total_stock,
        "total_stock_value_bdt": total_value,
        "by_alert_level": {k.value: len(v) for k, v in by_alert.items()},
        "items": [
            {
                "id": item.id,
                "name": item.name,
                "name_bn": item.name_bn,
                "category": item.category.value,
                "current_stock": item.current_stock,
                "min_stock": item.min_stock,
                "unit": item.unit,
                "alert_level": item.alert_level.value,
                "batch_number": item.batch_number,
                "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
            }
            for item in items
        ],
    }


async def add_inventory_stock(
    clinic_id: str,
    item_id: str,
    quantity: int,
    unit_price: int,
    transaction_type: TransactionType,
    db: AsyncSession,
    reference_type: Optional[str] = None,
    reference_id: Optional[str] = None,
    notes: Optional[str] = None,
    performed_by: Optional[str] = None,
) -> InventoryItem:
    """Add stock to an inventory item and record transaction."""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.clinic_id == clinic_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError("Inventory item not found")

    if transaction_type in (TransactionType.SALE, TransactionType.EXPIRED, TransactionType.DAMAGED, TransactionType.RETURN):
        item.current_stock -= quantity
    else:
        item.current_stock += quantity

    if item.current_stock < 0:
        item.current_stock = 0

    txn = InventoryTransaction(
        clinic_id=clinic_id,
        item_id=item_id,
        transaction_type=transaction_type,
        quantity=quantity,
        unit_price=unit_price,
        total_amount=quantity * unit_price,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        performed_by=performed_by,
    )
    db.add(txn)
    await db.flush()
    logger.info("Inventory stock updated", item_id=item_id, quantity=quantity, type=transaction_type.value)
    return item


async def search_inventory(
    clinic_id: str,
    db: AsyncSession,
    query_str: Optional[str] = None,
    category: Optional[MedicineCategory] = None,
    near_expiry_days: Optional[int] = None,
) -> List[Dict]:
    """Search inventory items by name, category, or expiry."""
    conditions = [
        InventoryItem.clinic_id == clinic_id,
        InventoryItem.is_active == True,
    ]

    if query_str:
        like = f"%{query_str}%"
        conditions.append(
            InventoryItem.name.ilike(like) | InventoryItem.generic_name.ilike(like) | InventoryItem.brand.ilike(like)
        )
    if category:
        conditions.append(InventoryItem.category == category)
    if near_expiry_days:
        from datetime import timedelta
        threshold = date.today() + timedelta(days=near_expiry_days)
        conditions.append(InventoryItem.expiry_date <= threshold)

    query = select(InventoryItem).where(and_(*conditions)).order_by(InventoryItem.name)
    result = await db.execute(query)
    items = result.scalars().all()

    return [
        {
            "id": item.id,
            "name": item.name,
            "name_bn": item.name_bn,
            "category": item.category.value,
            "generic_name": item.generic_name,
            "current_stock": item.current_stock,
            "min_stock": item.min_stock,
            "unit": item.unit,
            "unit_price": item.unit_price,
            "selling_price": item.selling_price,
            "alert_level": item.alert_level.value,
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
            "batch_number": item.batch_number,
            "requires_prescription": item.requires_prescription,
        }
        for item in items
    ]


async def get_inventory_transactions(
    clinic_id: str,
    db: AsyncSession,
    item_id: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    limit: int = 50,
) -> List[Dict]:
    """Get inventory transaction history."""
    conditions = [InventoryTransaction.clinic_id == clinic_id]
    if item_id:
        conditions.append(InventoryTransaction.item_id == item_id)
    if transaction_type:
        conditions.append(InventoryTransaction.transaction_type == transaction_type)

    query = select(InventoryTransaction).where(and_(*conditions)).order_by(InventoryTransaction.created_at.desc()).limit(limit)
    result = await db.execute(query)
    txns = result.scalars().all()

    return [
        {
            "id": txn.id,
            "item_id": txn.item_id,
            "transaction_type": txn.transaction_type.value,
            "quantity": txn.quantity,
            "unit_price": txn.unit_price,
            "total_amount": txn.total_amount,
            "reference_type": txn.reference_type,
            "reference_id": txn.reference_id,
            "notes": txn.notes,
            "performed_by": txn.performed_by,
            "created_at": txn.created_at.isoformat(),
        }
        for txn in txns
    ]


async def get_equipment_list(
    clinic_id: str,
    db: AsyncSession,
    equipment_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict]:
    """List medical equipment with maintenance tracking."""
    conditions = [Equipment.clinic_id == clinic_id, Equipment.is_active == True]
    if equipment_type:
        conditions.append(Equipment.equipment_type == equipment_type)
    if status:
        conditions.append(Equipment.status == status)

    query = select(Equipment).where(and_(*conditions)).order_by(Equipment.name)
    result = await db.execute(query)
    equipment = result.scalars().all()

    today = date.today()
    return [
        {
            "id": eq.id,
            "name": eq.name,
            "equipment_type": eq.equipment_type,
            "model": eq.model,
            "serial_number": eq.serial_number,
            "status": eq.status,
            "purchase_date": eq.purchase_date.isoformat() if eq.purchase_date else None,
            "warranty_expiry": eq.warranty_expiry.isoformat() if eq.warranty_expiry else None,
            "last_maintenance": eq.last_maintenance.isoformat() if eq.last_maintenance else None,
            "next_maintenance": eq.next_maintenance.isoformat() if eq.next_maintenance else None,
            "maintenance_overdue": (eq.next_maintenance and eq.next_maintenance < today) if eq.next_maintenance else False,
        }
        for eq in equipment
    ]


async def get_supply_list(
    clinic_id: str,
    db: AsyncSession,
    supply_type: Optional[str] = None,
    low_stock_only: bool = False,
) -> List[Dict]:
    """List medical supplies."""
    conditions = [MedicalSupply.clinic_id == clinic_id, MedicalSupply.is_active == True]
    if supply_type:
        conditions.append(MedicalSupply.supply_type == supply_type)
    if low_stock_only:
        conditions.append(MedicalSupply.current_stock <= MedicalSupply.min_stock)

    query = select(MedicalSupply).where(and_(*conditions)).order_by(MedicalSupply.name)
    result = await db.execute(query)
    supplies = result.scalars().all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "name_bn": s.name_bn,
            "supply_type": s.supply_type,
            "unit": s.unit,
            "current_stock": s.current_stock,
            "min_stock": s.min_stock,
            "unit_price": s.unit_price,
            "low_stock": s.current_stock <= s.min_stock,
        }
        for s in supplies
    ]
