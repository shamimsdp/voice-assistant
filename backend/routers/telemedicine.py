import structlog
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from db.base import get_db
from models.telemedicine import TelemedicineSession, SessionStatus
from models.user import User
from routers.auth import get_current_user
from services.telemedicine_service import create_session, get_sessions

router = APIRouter()
logger = structlog.get_logger()


class CreateSessionBody(BaseModel):
    patient_id: str
    doctor_id: str
    scheduled_at: str
    duration_min: int = 20
    appointment_id: Optional[str] = None
    meeting_url: Optional[str] = None
    room_name: Optional[str] = None
    provider: str = "internal"


class UpdateSessionStatusBody(BaseModel):
    status: SessionStatus


@router.post("/sessions")
async def schedule_session(
    body: CreateSessionBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        scheduled_at = datetime.fromisoformat(body.scheduled_at)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format. Use ISO 8601")

    session = await create_session(
        clinic_id=current_user.clinic_id,
        patient_id=body.patient_id,
        doctor_id=body.doctor_id,
        scheduled_at=scheduled_at,
        db=db,
        appointment_id=body.appointment_id,
        duration_min=body.duration_min,
        meeting_url=body.meeting_url,
        room_name=body.room_name,
        provider=body.provider,
    )
    return {
        "id": session.id,
        "scheduled_at": session.scheduled_at.isoformat(),
        "status": session.status.value,
    }


@router.get("/sessions")
async def list_sessions(
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[SessionStatus] = None,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_sessions(
        clinic_id=current_user.clinic_id,
        db=db,
        patient_id=patient_id,
        doctor_id=doctor_id,
        status=status,
        limit=limit,
    )


@router.patch("/sessions/{session_id}/status")
async def update_session_status(
    session_id: str,
    body: UpdateSessionStatusBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TelemedicineSession).where(
            TelemedicineSession.id == session_id,
            TelemedicineSession.clinic_id == current_user.clinic_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = body.status
    now = datetime.utcnow()

    if body.status == SessionStatus.IN_PROGRESS:
        pass
    elif body.status == SessionStatus.COMPLETED:
        session.ended_at = now
    elif body.status == SessionStatus.CANCELLED:
        session.ended_at = now

    await db.flush()
    return {"id": session.id, "status": session.status.value, "ended_at": session.ended_at.isoformat() if session.ended_at else None}
