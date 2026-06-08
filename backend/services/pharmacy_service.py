import structlog
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from models.pharmacy import PharmacyOrder, PharmacyOrderItem, DispenseStatus

logger = structlog.get_logger()


async def create_pharmacy_order(
    clinic_id: str,
    patient_id: str,
    db: AsyncSession,
    doctor_id: Optional[str] = None,
    prescription_id: Optional[str] = None,
    delivery_address: Optional[str] = None,
    delivery_fee: int = 0,
    notes: Optional[str] = None,
) -> PharmacyOrder:
    order_count = await db.execute(select(func.count(PharmacyOrder.id)))
    count = order_count.scalar() or 0
    order_number = f"RX-{datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"

    order = PharmacyOrder(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        prescription_id=prescription_id,
        order_number=order_number,
        dispense_status=DispenseStatus.PENDING,
        delivery_address=delivery_address,
        delivery_fee=delivery_fee,
        notes=notes,
    )
    db.add(order)
    await db.flush()
    logger.info("Pharmacy order created", order_number=order_number)
    return order


async def get_pharmacy_orders(
    clinic_id: str,
    db: AsyncSession,
    patient_id: Optional[str] = None,
    status: Optional[DispenseStatus] = None,
    limit: int = 50,
) -> List[Dict]:
    conditions = [PharmacyOrder.clinic_id == clinic_id]
    if patient_id:
        conditions.append(PharmacyOrder.patient_id == patient_id)
    if status:
        conditions.append(PharmacyOrder.dispense_status == status)

    query = select(PharmacyOrder).where(and_(*conditions)).order_by(PharmacyOrder.created_at.desc()).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()

    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "patient_id": o.patient_id,
            "dispense_status": o.dispense_status.value,
            "delivery_status": o.delivery_status.value if o.delivery_status else None,
            "total_amount": o.total_amount,
            "is_paid": o.is_paid,
            "delivery_address": o.delivery_address,
            "delivery_partner": o.delivery_partner,
            "created_at": o.created_at.isoformat(),
        }
        for o in orders
    ]
