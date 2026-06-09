import structlog
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from models.notification import Notification

logger = structlog.get_logger()


async def create_notification(
    clinic_id: str,
    user_id: str,
    type: str,
    title: str,
    db: AsyncSession,
    title_bn: Optional[str] = None,
    body: Optional[str] = None,
    body_bn: Optional[str] = None,
    link: Optional[str] = None,
) -> Notification:
    notification = Notification(
        clinic_id=clinic_id,
        user_id=user_id,
        type=type,
        title=title,
        title_bn=title_bn,
        body=body,
        body_bn=body_bn,
        link=link,
    )
    db.add(notification)
    await db.flush()
    logger.info("Notification created", notification_id=notification.id, type=type)
    return notification


async def get_notifications(
    clinic_id: str,
    user_id: str,
    db: AsyncSession,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict]:
    conditions = [
        Notification.clinic_id == clinic_id,
        Notification.user_id == user_id,
    ]
    if unread_only:
        conditions.append(Notification.is_read == False)

    query = (
        select(Notification)
        .where(and_(*conditions))
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    notifications = result.scalars().all()

    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "title_bn": n.title_bn,
            "body": n.body,
            "body_bn": n.body_bn,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


async def get_unread_count(
    clinic_id: str,
    user_id: str,
    db: AsyncSession,
) -> int:
    query = select(func.count(Notification.id)).where(
        Notification.clinic_id == clinic_id,
        Notification.user_id == user_id,
        Notification.is_read == False,
    )
    result = await db.execute(query)
    return result.scalar() or 0


async def mark_as_read(
    notification_id: str,
    clinic_id: str,
    user_id: str,
    db: AsyncSession,
) -> Optional[Notification]:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.clinic_id == clinic_id,
            Notification.user_id == user_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        return None
    notification.is_read = True
    await db.flush()
    return notification


async def mark_all_as_read(
    clinic_id: str,
    user_id: str,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(Notification).where(
            Notification.clinic_id == clinic_id,
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.is_read = True
    await db.flush()
    return len(notifications)
