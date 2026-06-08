"""
routers/advanced_appointments.py — Advanced appointment management API
Waiting list, recurring appointments, symptom matching, group booking, questionnaires
"""
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional, List

from db.base import get_db
from models.appointment import Appointment, AppointmentStatus
from models.advanced_appointments import (
    WaitingListEntry, WaitingListStatus,
    RecurringAppointmentTemplate,
    GroupBooking, GroupBookingMember,
    Questionnaire, QuestionnaireResponse, QuestionStatus,
)
from models.patient import Patient
from models.doctor import Doctor
from routers.auth import get_current_user
from models.user import User
from services.advanced_appointments import (
    detect_conflicts, find_available_slots,
    generate_recurring_instances, promote_from_waiting_list,
    estimate_appointment_duration,
)
from services.symptom_matcher import find_matching_doctors

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SymptomMatchRequest(BaseModel):
    text: str
    max_results: int = 3


class WaitingListCreate(BaseModel):
    doctor_id: str
    patient_id: str
    preferred_date: date
    preferred_time_start: Optional[str] = None
    preferred_time_end: Optional[str] = None
    notes: Optional[str] = None


class RecurringTemplateCreate(BaseModel):
    doctor_id: str
    patient_id: str
    start_date: date
    end_date: Optional[date] = None
    time_of_day: str
    duration_min: int = 20
    frequency: str = "weekly"
    interval: int = 1
    days_of_week: Optional[list] = None
    notes: Optional[str] = None


class GroupBookingCreate(BaseModel):
    doctor_id: str
    primary_patient_id: str
    scheduled_at: datetime
    duration_min: int = 30
    slot_type: str = "vaccination"
    max_members: int = 5
    members: List[dict] = []


class ConflictCheckRequest(BaseModel):
    doctor_id: str
    scheduled_at: datetime
    duration_min: int = 20
    appointment_id: Optional[str] = None


class DurationEstimateRequest(BaseModel):
    patient_id: str
    doctor_id: str
    complaint_text: str


class QuestionnaireCreate(BaseModel):
    title: str
    title_bn: Optional[str] = None
    description: Optional[str] = None
    questions: list


class QuestionnaireResponseSubmit(BaseModel):
    questionnaire_id: str
    appointment_id: Optional[str] = None
    responses: dict
    submitted_via: str = "voice"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/match-doctors")
async def match_doctors(
    body: SymptomMatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Match patient symptoms to the most suitable doctors."""
    results = await find_matching_doctors(
        text=body.text,
        clinic_id=current_user.clinic_id,
        db=db,
        max_results=body.max_results,
    )
    return {"matches": results}


@router.post("/check-conflicts")
async def check_conflicts(
    body: ConflictCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check for scheduling conflicts before booking."""
    result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == body.doctor_id,
            Appointment.clinic_id == current_user.clinic_id,
        )
    )
    existing = result.scalars().all()
    conflicts = detect_conflicts(
        existing=list(existing),
        proposed_start=body.scheduled_at,
        proposed_duration=body.duration_min,
        appointment_id=body.appointment_id,
    )
    return {"has_conflict": len(conflicts) > 0, "conflicts": conflicts}


@router.get("/available-slots/{doctor_id}")
async def get_available_slots(
    doctor_id: str,
    target_date: str = Query(..., description="Date YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get available time slots for a doctor on a specific date."""
    doc_result = await db.execute(
        select(Doctor).where(
            Doctor.id == doctor_id,
            Doctor.clinic_id == current_user.clinic_id,
        )
    )
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        target = datetime.strptime(target_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    slots = await find_available_slots(doctor, target, db)
    return {"date": target_date, "doctor_id": doctor_id, "available_slots": slots}


@router.post("/estimate-duration")
async def estimate_duration(
    body: DurationEstimateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered appointment duration estimation based on complaint."""
    doc_result = await db.execute(
        select(Doctor).where(
            Doctor.id == body.doctor_id,
            Doctor.clinic_id == current_user.clinic_id,
        )
    )
    doctor = doc_result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    duration = await estimate_appointment_duration(
        patient_id=body.patient_id,
        doctor=doctor,
        complaint_text=body.complaint_text,
        db=db,
    )
    return {"estimated_duration_min": duration, "doctor_id": body.doctor_id}


# ── Waiting List ──────────────────────────────────────────────────────────────

@router.post("/waiting-list")
async def add_waiting_list(
    body: WaitingListCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a patient to the waiting list."""
    from services.advanced_appointments import add_to_waiting_list

    entry = await add_to_waiting_list(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        preferred_date=body.preferred_date,
        preferred_time_start=body.preferred_time_start,
        preferred_time_end=body.preferred_time_end,
        notes=body.notes,
        db=db,
    )
    return {"id": entry.id, "status": entry.status.value}


@router.get("/waiting-list")
async def list_waiting_list(
    doctor_id: Optional[str] = None,
    status: Optional[WaitingListStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List waiting list entries for the clinic."""
    query = select(WaitingListEntry).where(
        WaitingListEntry.clinic_id == current_user.clinic_id
    )

    if doctor_id:
        query = query.where(WaitingListEntry.doctor_id == doctor_id)
    if status:
        query = query.where(WaitingListEntry.status == status)

    query = query.order_by(WaitingListEntry.created_at.asc())
    result = await db.execute(query)
    entries = result.scalars().all()

    return [
        {
            "id": e.id,
            "doctor_id": e.doctor_id,
            "patient_id": e.patient_id,
            "preferred_date": e.preferred_date.isoformat(),
            "preferred_time_start": e.preferred_time_start,
            "preferred_time_end": e.preferred_time_end,
            "status": e.status.value,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]


@router.delete("/waiting-list/{entry_id}", status_code=204)
async def remove_waiting_list(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a waiting list entry."""
    result = await db.execute(
        select(WaitingListEntry).where(
            WaitingListEntry.id == entry_id,
            WaitingListEntry.clinic_id == current_user.clinic_id,
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    await db.delete(entry)


# ── Recurring Appointments ────────────────────────────────────────────────────

@router.post("/recurring")
async def create_recurring_template(
    body: RecurringTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a recurring appointment template."""
    template = RecurringAppointmentTemplate(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        patient_id=body.patient_id,
        start_date=body.start_date,
        end_date=body.end_date,
        time_of_day=body.time_of_day,
        duration_min=body.duration_min,
        frequency=body.frequency,
        interval=body.interval,
        days_of_week=body.days_of_week,
        notes=body.notes,
    )
    db.add(template)
    await db.flush()

    instances = await generate_recurring_instances(template, db)

    return {
        "template_id": template.id,
        "instances_created": len(instances),
        "frequency": template.frequency,
    }


@router.get("/recurring")
async def list_recurring_templates(
    doctor_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List recurring appointment templates."""
    query = select(RecurringAppointmentTemplate).where(
        RecurringAppointmentTemplate.clinic_id == current_user.clinic_id,
        RecurringAppointmentTemplate.is_active == True,
    )
    if doctor_id:
        query = query.where(RecurringAppointmentTemplate.doctor_id == doctor_id)

    result = await db.execute(query)
    templates = result.scalars().all()

    return [
        {
            "id": t.id,
            "doctor_id": t.doctor_id,
            "patient_id": t.patient_id,
            "start_date": t.start_date.isoformat(),
            "end_date": t.end_date.isoformat() if t.end_date else None,
            "time_of_day": t.time_of_day,
            "frequency": t.frequency,
            "is_active": t.is_active,
        }
        for t in templates
    ]


@router.delete("/recurring/{template_id}", status_code=204)
async def delete_recurring_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate a recurring appointment template."""
    result = await db.execute(
        select(RecurringAppointmentTemplate).where(
            RecurringAppointmentTemplate.id == template_id,
            RecurringAppointmentTemplate.clinic_id == current_user.clinic_id,
        )
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = False


# ── Group Booking ─────────────────────────────────────────────────────────────

@router.post("/group-bookings")
async def create_group_booking(
    body: GroupBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a group booking for family/vaccination visits."""
    booking = GroupBooking(
        clinic_id=current_user.clinic_id,
        doctor_id=body.doctor_id,
        primary_patient_id=body.primary_patient_id,
        scheduled_at=body.scheduled_at,
        duration_min=body.duration_min,
        slot_type=body.slot_type,
        max_members=body.max_members,
    )
    db.add(booking)
    await db.flush()

    members = []
    for m in body.members:
        member = GroupBookingMember(
            group_booking_id=booking.id,
            patient_id=m.get("patient_id"),
            name=m["name"],
            age=m.get("age"),
            relationship=m.get("relationship"),
        )
        db.add(member)
        members.append(member)

    await db.flush()

    return {
        "id": booking.id,
        "slot_type": booking.slot_type,
        "member_count": len(members),
        "scheduled_at": booking.scheduled_at.isoformat(),
    }


@router.get("/group-bookings")
async def list_group_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List group bookings for the clinic."""
    result = await db.execute(
        select(GroupBooking).where(
            GroupBooking.clinic_id == current_user.clinic_id,
        ).order_by(GroupBooking.scheduled_at.desc())
    )
    bookings = result.scalars().all()

    return [
        {
            "id": b.id,
            "doctor_id": b.doctor_id,
            "slot_type": b.slot_type,
            "scheduled_at": b.scheduled_at.isoformat(),
            "max_members": b.max_members,
            "member_count": len(b.members),
        }
        for b in bookings
    ]


# ── Questionnaires ────────────────────────────────────────────────────────────

@router.post("/questionnaires")
async def create_questionnaire(
    body: QuestionnaireCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a pre-visit questionnaire template."""
    q = Questionnaire(
        clinic_id=current_user.clinic_id,
        title=body.title,
        title_bn=body.title_bn,
        description=body.description,
        questions=body.questions,
    )
    db.add(q)
    await db.flush()
    return {"id": q.id, "title": q.title, "question_count": len(body.questions)}


@router.get("/questionnaires")
async def list_questionnaires(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List active questionnaires."""
    result = await db.execute(
        select(Questionnaire).where(
            Questionnaire.clinic_id == current_user.clinic_id,
            Questionnaire.is_active == True,
        )
    )
    questionnaires = result.scalars().all()

    return [
        {
            "id": q.id,
            "title": q.title,
            "title_bn": q.title_bn,
            "description": q.description,
            "question_count": len(q.questions),
        }
        for q in questionnaires
    ]


@router.post("/questionnaire-responses")
async def submit_questionnaire_response(
    body: QuestionnaireResponseSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a patient's questionnaire responses."""
    from services.sms_service import send_appointment_sms

    response = QuestionnaireResponse(
        questionnaire_id=body.questionnaire_id,
        appointment_id=body.appointment_id,
        patient_id="",
        responses=body.responses,
        submitted_via=body.submitted_via,
        status=QuestionStatus.COMPLETED,
    )

    result = await db.execute(
        select(QuestionnaireResponse).where(
            QuestionnaireResponse.appointment_id == body.appointment_id,
            QuestionnaireResponse.questionnaire_id == body.questionnaire_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.responses = body.responses
        existing.status = QuestionStatus.COMPLETED
        existing.submitted_via = body.submitted_via
        response = existing
    else:
        db.add(response)

    await db.flush()

    return {"id": response.id, "status": response.status.value}


@router.get("/questionnaire-responses/{appointment_id}")
async def get_appointment_responses(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all questionnaire responses for an appointment."""
    result = await db.execute(
        select(QuestionnaireResponse).where(
            QuestionnaireResponse.appointment_id == appointment_id,
        )
    )
    responses = result.scalars().all()

    return [
        {
            "id": r.id,
            "questionnaire_id": r.questionnaire_id,
            "responses": r.responses,
            "status": r.status.value,
            "submitted_via": r.submitted_via,
            "created_at": r.created_at.isoformat(),
        }
        for r in responses
    ]
