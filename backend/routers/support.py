import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from db.base import get_db
from models.user import User
from models.support import TicketPriority, TicketStatus
from routers.auth import get_current_user
from services.support_service import (
    create_ticket,
    get_tickets,
    get_ticket,
    update_ticket,
    add_comment,
)

router = APIRouter()
logger = structlog.get_logger()


class CreateTicketBody(BaseModel):
    subject: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM


class UpdateTicketBody(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to: Optional[str] = None


class AddCommentBody(BaseModel):
    body: str


@router.post("/support/tickets")
async def create_ticket_endpoint(
    body: CreateTicketBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = await create_ticket(
        clinic_id=current_user.clinic_id,
        created_by=current_user.id,
        subject=body.subject,
        description=body.description,
        category=body.category,
        priority=body.priority,
        db=db,
    )
    return {
        "id": ticket.id,
        "subject": ticket.subject,
        "priority": ticket.priority.value,
        "status": ticket.status.value,
        "created_at": ticket.created_at.isoformat(),
    }


@router.get("/support/tickets")
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_tickets(
        clinic_id=current_user.clinic_id,
        db=db,
        status=status,
        priority=priority,
        limit=limit,
        offset=offset,
    )


@router.get("/support/tickets/{ticket_id}")
async def get_ticket_detail(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = await get_ticket(ticket_id, clinic_id=current_user.clinic_id, db=db)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/support/tickets/{ticket_id}")
async def update_ticket_endpoint(
    ticket_id: str,
    body: UpdateTicketBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = await update_ticket(
        ticket_id=ticket_id,
        clinic_id=current_user.clinic_id,
        db=db,
        status=body.status,
        priority=body.priority,
        assigned_to=body.assigned_to,
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": ticket.id,
        "status": ticket.status.value,
        "priority": ticket.priority.value,
        "assigned_to": ticket.assigned_to,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
    }


@router.post("/support/tickets/{ticket_id}/comments")
async def add_ticket_comment(
    ticket_id: str,
    body: AddCommentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = await add_comment(
        ticket_id=ticket_id,
        clinic_id=current_user.clinic_id,
        user_id=current_user.id,
        body=body.body,
        db=db,
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {
        "id": comment.id,
        "ticket_id": comment.ticket_id,
        "body": comment.body,
        "created_at": comment.created_at.isoformat(),
    }
