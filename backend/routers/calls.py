"""
routers/calls.py — Call logs API (read-only for dashboard)
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.base import get_db
from models.call_log import CallLog
from routers.auth import get_current_user
from models.user import User

router = APIRouter()


@router.get("/")
async def list_calls(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recent call logs for the clinic."""
    result = await db.execute(
        select(CallLog)
        .where(CallLog.clinic_id == current_user.clinic_id)
        .order_by(CallLog.started_at.desc())
        .limit(limit)
        .offset(offset)
    )
    calls = result.scalars().all()

    return [
        {
            "id": c.id,
            "caller_phone": c.caller_phone[-4:].rjust(len(c.caller_phone), "*"),  # Mask for privacy
            "status": c.status.value,
            "direction": c.direction,
            "started_at": c.started_at.isoformat(),
            "duration_seconds": c.duration_seconds,
            "detected_language": c.detected_language,
            "appointment_booked": c.appointment_booked,
            "appointment_id": c.appointment_id,
        }
        for c in calls
    ]


@router.get("/{call_id}")
async def get_call(
    call_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full call details including transcript."""
    result = await db.execute(
        select(CallLog).where(
            CallLog.id == call_id,
            CallLog.clinic_id == current_user.clinic_id,
        )
    )
    call = result.scalar_one_or_none()
    if not call:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Call not found")

    import json
    transcript = []
    if call.transcript:
        try:
            transcript = json.loads(call.transcript)
        except Exception:
            transcript = []

    return {
        "id": call.id,
        "caller_phone": call.caller_phone,
        "status": call.status.value,
        "direction": call.direction,
        "started_at": call.started_at.isoformat(),
        "ended_at": call.ended_at.isoformat() if call.ended_at else None,
        "duration_seconds": call.duration_seconds,
        "detected_language": call.detected_language,
        "transcript": transcript,
        "appointment_booked": call.appointment_booked,
        "appointment_id": call.appointment_id,
        "stt_confidence": call.stt_confidence,
        "llm_tokens_used": call.llm_tokens_used,
    }
