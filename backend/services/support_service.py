import structlog
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from models.support import SupportTicket, TicketComment, TicketPriority, TicketStatus

logger = structlog.get_logger()


async def create_ticket(
    clinic_id: str,
    created_by: str,
    subject: str,
    db: AsyncSession,
    description: Optional[str] = None,
    category: Optional[str] = None,
    priority: TicketPriority = TicketPriority.MEDIUM,
) -> SupportTicket:
    ticket = SupportTicket(
        clinic_id=clinic_id,
        created_by=created_by,
        subject=subject,
        description=description,
        category=category,
        priority=priority,
    )
    db.add(ticket)
    await db.flush()
    logger.info("Support ticket created", ticket_id=ticket.id, priority=priority.value)
    return ticket


async def get_tickets(
    clinic_id: str,
    db: AsyncSession,
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict]:
    conditions = [SupportTicket.clinic_id == clinic_id]
    if status:
        conditions.append(SupportTicket.status == status)
    if priority:
        conditions.append(SupportTicket.priority == priority)

    query = (
        select(SupportTicket)
        .where(and_(*conditions))
        .order_by(SupportTicket.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    tickets = result.scalars().all()
    return [_format_ticket(t) for t in tickets]


async def get_ticket(
    ticket_id: str,
    clinic_id: str,
    db: AsyncSession,
) -> Optional[Dict]:
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.clinic_id == clinic_id,
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        return None

    data = _format_ticket(ticket)

    comment_result = await db.execute(
        select(TicketComment)
        .where(TicketComment.ticket_id == ticket_id)
        .order_by(TicketComment.created_at.asc())
    )
    data["comments"] = [
        {
            "id": c.id,
            "user_id": c.user_id,
            "body": c.body,
            "created_at": c.created_at.isoformat(),
        }
        for c in comment_result.scalars().all()
    ]
    return data


async def update_ticket(
    ticket_id: str,
    clinic_id: str,
    db: AsyncSession,
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    assigned_to: Optional[str] = None,
) -> Optional[SupportTicket]:
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.clinic_id == clinic_id,
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        return None

    if status is not None:
        ticket.status = status
        if status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
    if priority is not None:
        ticket.priority = priority
    if assigned_to is not None:
        ticket.assigned_to = assigned_to

    await db.flush()
    return ticket


async def add_comment(
    ticket_id: str,
    clinic_id: str,
    user_id: str,
    body: str,
    db: AsyncSession,
) -> Optional[TicketComment]:
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.id == ticket_id,
            SupportTicket.clinic_id == clinic_id,
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        return None

    comment = TicketComment(ticket_id=ticket_id, user_id=user_id, body=body)
    db.add(comment)
    await db.flush()
    return comment


def _format_ticket(t: SupportTicket) -> Dict:
    return {
        "id": t.id,
        "clinic_id": t.clinic_id,
        "created_by": t.created_by,
        "assigned_to": t.assigned_to,
        "subject": t.subject,
        "description": t.description,
        "category": t.category,
        "priority": t.priority.value,
        "status": t.status.value,
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat(),
    }
