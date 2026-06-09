import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from db.base import get_db
from models.user import User
from routers.auth import get_current_user
from services.notification_service import (
    create_notification,
    get_notifications,
    get_unread_count,
    mark_as_read,
    mark_all_as_read,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateNotificationBody(BaseModel):
    user_id: str
    type: str
    title: str
    title_bn: Optional[str] = None
    body: Optional[str] = None
    body_bn: Optional[str] = None
    link: Optional[str] = None


class MarkReadBody(BaseModel):
    notification_id: str


@router.get("/notifications")
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_notifications(
        clinic_id=current_user.clinic_id,
        user_id=current_user.id,
        db=db,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
    )


@router.get("/notifications/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await get_unread_count(
        clinic_id=current_user.clinic_id,
        user_id=current_user.id,
        db=db,
    )
    return {"count": count}


@router.post("/notifications")
async def create_notification_endpoint(
    body: CreateNotificationBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = await create_notification(
        clinic_id=current_user.clinic_id,
        user_id=body.user_id,
        type=body.type,
        title=body.title,
        title_bn=body.title_bn,
        body=body.body,
        body_bn=body.body_bn,
        link=body.link,
        db=db,
    )
    return {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "is_read": notification.is_read,
        "created_at": notification.created_at.isoformat(),
    }


@router.patch("/notifications/{notification_id}/read")
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = await mark_as_read(
        notification_id=notification_id,
        clinic_id=current_user.clinic_id,
        user_id=current_user.id,
        db=db,
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"id": notification.id, "is_read": True}


@router.post("/notifications/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = await mark_all_as_read(
        clinic_id=current_user.clinic_id,
        user_id=current_user.id,
        db=db,
    )
    return {"marked_read": count}
