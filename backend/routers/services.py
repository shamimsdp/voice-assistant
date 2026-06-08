"""
routers/services.py — Medical Service CRUD API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.agent import Service
from models.clinic import Clinic
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_min: int = 30
    price: float = 0.0
    category: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_min: Optional[int] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    duration_min: int
    price: float
    category: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


@router.get("/", response_model=list[ServiceResponse])
async def list_services(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Service).where(
        Service.clinic_id == current_user.clinic_id,
    )
    if category:
        query = query.where(Service.category == category)
    query = query.order_by(Service.category, Service.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ServiceResponse, status_code=201)
async def create_service(
    body: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    svc = Service(
        clinic_id=current_user.clinic_id,
        name=body.name,
        description=body.description,
        duration_min=body.duration_min,
        price=body.price,
        category=body.category,
    )
    db.add(svc)
    await db.flush()
    await db.refresh(svc)
    return svc


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.clinic_id == current_user.clinic_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    body: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.clinic_id == current_user.clinic_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(svc, key, val)
    await db.flush()
    await db.refresh(svc)
    return svc


@router.delete("/{service_id}")
async def delete_service(
    service_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.clinic_id == current_user.clinic_id)
    )
    svc = result.scalar_one_or_none()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    await db.delete(svc)
    await db.flush()
    return {"message": "Service deleted"}
