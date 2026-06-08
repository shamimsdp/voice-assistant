import structlog
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from models.telemedicine import TelemedicineSession, SessionStatus

logger = structlog.get_logger()


async def create_session(
    clinic_id: str,
    patient_id: str,
    doctor_id: str,
    scheduled_at: datetime,
    db: AsyncSession,
    appointment_id: Optional[str] = None,
    duration_min: int = 20,
    meeting_url: Optional[str] = None,
    room_name: Optional[str] = None,
    provider: str = "internal",
) -> TelemedicineSession:
    session = TelemedicineSession(
        clinic_id=clinic_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        scheduled_at=scheduled_at,
        duration_min=duration_min,
        status=SessionStatus.SCHEDULED,
        meeting_url=meeting_url,
        room_name=room_name,
        provider=provider,
    )
    db.add(session)
    await db.flush()
    logger.info("Telemedicine session created", session_id=session.id)
    return session


async def get_sessions(
    clinic_id: str,
    db: AsyncSession,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[SessionStatus] = None,
    limit: int = 50,
) -> List[Dict]:
    conditions = [TelemedicineSession.clinic_id == clinic_id]
    if patient_id:
        conditions.append(TelemedicineSession.patient_id == patient_id)
    if doctor_id:
        conditions.append(TelemedicineSession.doctor_id == doctor_id)
    if status:
        conditions.append(TelemedicineSession.status == status)

    query = select(TelemedicineSession).where(and_(*conditions)).order_by(TelemedicineSession.scheduled_at.desc()).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()

    return [
        {
            "id": s.id,
            "patient_id": s.patient_id,
            "doctor_id": s.doctor_id,
            "scheduled_at": s.scheduled_at.isoformat(),
            "duration_min": s.duration_min,
            "status": s.status.value,
            "meeting_url": s.meeting_url,
            "room_name": s.room_name,
            "patient_joined_at": s.patient_joined_at.isoformat() if s.patient_joined_at else None,
            "doctor_joined_at": s.doctor_joined_at.isoformat() if s.doctor_joined_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "recording_url": s.recording_url,
        }
        for s in sessions
    ]
