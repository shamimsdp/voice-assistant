import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.pharmacy import PharmacyOrder, PharmacyOrderItem, DispenseStatus
from models.user import User
from routers.auth import get_current_user
from services.pharmacy_service import create_pharmacy_order, get_pharmacy_orders

router = APIRouter()
logger = structlog.get_logger()


class CreateOrderBody(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    prescription_id: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_fee: int = 0
    notes: Optional[str] = None


class AddItemBody(BaseModel):
    medicine_name: str
    dosage: str
    quantity: int
    unit_price: int = 0
    inventory_item_id: Optional[str] = None


@router.post("/orders")
async def create_order(
    body: CreateOrderBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await create_pharmacy_order(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        db=db,
        doctor_id=body.doctor_id,
        prescription_id=body.prescription_id,
        delivery_address=body.delivery_address,
        delivery_fee=body.delivery_fee,
        notes=body.notes,
    )
    return {"id": order.id, "order_number": order.order_number, "status": order.dispense_status.value}


@router.get("/orders")
async def list_orders(
    patient_id: Optional[str] = None,
    status: Optional[DispenseStatus] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_pharmacy_orders(
        clinic_id=current_user.clinic_id,
        db=db,
        patient_id=patient_id,
        status=status,
        limit=limit,
    )


@router.post("/orders/{order_id}/items")
async def add_order_item(
    order_id: str,
    body: AddItemBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = PharmacyOrderItem(
        order_id=order_id,
        inventory_item_id=body.inventory_item_id,
        medicine_name=body.medicine_name,
        dosage=body.dosage,
        quantity=body.quantity,
        unit_price=body.unit_price,
        total_price=body.quantity * body.unit_price,
    )
    db.add(item)
    await db.flush()

    total_result = await db.execute(
        select(PharmacyOrderItem).where(PharmacyOrderItem.order_id == order_id)
    )
    items = total_result.scalars().all()
    total = sum(i.total_price for i in items)

    order_result = await db.execute(select(PharmacyOrder).where(PharmacyOrder.id == order_id))
    order = order_result.scalar_one_or_none()
    if order:
        order.total_amount = total

    await db.flush()
    return {
        "id": item.id,
        "medicine_name": item.medicine_name,
        "quantity": item.quantity,
        "total_price": item.total_price,
        "order_total": total,
    }


@router.post("/orders/{order_id}/dispense")
async def dispense_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PharmacyOrder).where(
            PharmacyOrder.id == order_id,
            PharmacyOrder.clinic_id == current_user.clinic_id,
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items_result = await db.execute(
        select(PharmacyOrderItem).where(PharmacyOrderItem.order_id == order_id)
    )
    items = items_result.scalars().all()
    for item in items:
        item.is_dispensed = True

    order.dispense_status = DispenseStatus.DISPENSED
    await db.flush()
    return {"id": order.id, "order_number": order.order_number, "status": order.dispense_status.value}
