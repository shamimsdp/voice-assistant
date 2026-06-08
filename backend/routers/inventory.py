import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.clinic_operations import (
    InventoryItem, InventoryTransaction, MedicalSupply, Equipment,
    MedicineCategory, TransactionType,
)
from models.user import User
from routers.auth import get_current_user
from services.clinic_operations_service import (
    get_inventory_summary,
    add_inventory_stock,
    search_inventory,
    get_inventory_transactions,
    get_equipment_list,
    get_supply_list,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateInventoryItemBody(BaseModel):
    name: str
    name_bn: Optional[str] = None
    category: MedicineCategory
    generic_name: Optional[str] = None
    brand: Optional[str] = None
    unit: str
    current_stock: int = 0
    min_stock: int = 10
    max_stock: int = 100
    unit_price: int = 0
    selling_price: int = 0
    expiry_date: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturer: Optional[str] = None
    requires_prescription: bool = False


class StockUpdateBody(BaseModel):
    item_id: str
    quantity: int
    unit_price: int
    transaction_type: TransactionType
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    performed_by: Optional[str] = None


class CreateSupplyBody(BaseModel):
    name: str
    name_bn: Optional[str] = None
    supply_type: str
    unit: str
    current_stock: int = 0
    min_stock: int = 5
    unit_price: int = 0


class CreateEquipmentBody(BaseModel):
    name: str
    name_bn: Optional[str] = None
    equipment_type: str
    serial_number: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    purchase_date: Optional[str] = None
    warranty_expiry: Optional[str] = None
    status: str = "operational"


@router.get("/summary")
async def inventory_summary(
    category: Optional[MedicineCategory] = None,
    alert_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_inventory_summary(
        clinic_id=current_user.clinic_id,
        db=db,
        category=category,
    )


@router.get("/search")
async def inventory_search(
    q: Optional[str] = Query(None, description="Search by name/generic/brand"),
    category: Optional[MedicineCategory] = None,
    near_expiry_days: Optional[int] = Query(None, description="Items expiring within N days"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await search_inventory(
        clinic_id=current_user.clinic_id,
        db=db,
        query_str=q,
        category=category,
        near_expiry_days=near_expiry_days,
    )


@router.post("/items")
async def create_inventory_item(
    body: CreateInventoryItemBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = InventoryItem(
        clinic_id=current_user.clinic_id,
        name=body.name,
        name_bn=body.name_bn,
        category=body.category,
        generic_name=body.generic_name,
        brand=body.brand,
        unit=body.unit,
        current_stock=body.current_stock,
        min_stock=body.min_stock,
        max_stock=body.max_stock,
        unit_price=body.unit_price,
        selling_price=body.selling_price,
        batch_number=body.batch_number,
        manufacturer=body.manufacturer,
        requires_prescription=body.requires_prescription,
    )
    if body.expiry_date:
        from datetime import date
        try:
            item.expiry_date = date.fromisoformat(body.expiry_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry_date format. Use YYYY-MM-DD")

    db.add(item)
    await db.flush()
    logger.info("Inventory item created", name=body.name, category=body.category.value)
    return {"id": item.id, "name": item.name, "current_stock": item.current_stock}


@router.post("/stock")
async def update_stock(
    body: StockUpdateBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        item = await add_inventory_stock(
            clinic_id=current_user.clinic_id,
            item_id=body.item_id,
            quantity=body.quantity,
            unit_price=body.unit_price,
            transaction_type=body.transaction_type,
            db=db,
            reference_type=body.reference_type,
            reference_id=body.reference_id,
            notes=body.notes,
            performed_by=body.performed_by,
        )
        return {"id": item.id, "name": item.name, "current_stock": item.current_stock, "alert_level": item.alert_level.value}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/transactions")
async def list_transactions(
    item_id: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_inventory_transactions(
        clinic_id=current_user.clinic_id,
        db=db,
        item_id=item_id,
        transaction_type=transaction_type,
        limit=limit,
    )


@router.get("/supplies")
async def list_supplies(
    supply_type: Optional[str] = None,
    low_stock_only: bool = Query(False, description="Filter low stock items"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_supply_list(
        clinic_id=current_user.clinic_id,
        db=db,
        supply_type=supply_type,
        low_stock_only=low_stock_only,
    )


@router.post("/supplies")
async def create_supply(
    body: CreateSupplyBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supply = MedicalSupply(
        clinic_id=current_user.clinic_id,
        name=body.name,
        name_bn=body.name_bn,
        supply_type=body.supply_type,
        unit=body.unit,
        current_stock=body.current_stock,
        min_stock=body.min_stock,
        unit_price=body.unit_price,
    )
    db.add(supply)
    await db.flush()
    return {"id": supply.id, "name": supply.name, "current_stock": supply.current_stock}


@router.get("/equipment")
async def list_equipment(
    equipment_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_equipment_list(
        clinic_id=current_user.clinic_id,
        db=db,
        equipment_type=equipment_type,
        status=status,
    )


@router.post("/equipment")
async def create_equipment(
    body: CreateEquipmentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eq = Equipment(
        clinic_id=current_user.clinic_id,
        name=body.name,
        name_bn=body.name_bn,
        equipment_type=body.equipment_type,
        serial_number=body.serial_number,
        model=body.model,
        manufacturer=body.manufacturer,
        status=body.status,
    )
    if body.purchase_date:
        from datetime import date
        try:
            eq.purchase_date = date.fromisoformat(body.purchase_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid purchase_date format")
    if body.warranty_expiry:
        from datetime import date
        try:
            eq.warranty_expiry = date.fromisoformat(body.warranty_expiry)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid warranty_expiry format")

    db.add(eq)
    await db.flush()
    return {"id": eq.id, "name": eq.name, "status": eq.status}
