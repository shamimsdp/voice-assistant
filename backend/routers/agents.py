"""
routers/agents.py — AI Agent Management API
8 pre-defined agents seeded per clinic, plus custom agent creation.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import Optional

from db.base import get_db
from models.agent import Agent, Service, AgentService
from routers.auth import get_current_user
from models.user import User

router = APIRouter()

# ── 8 Pre-defined Agent Templates ─────────────────────────────────────────────
PREDEFINED_AGENTS = [
    {
        "name": "Front Desk Receptionist",
        "voice": "Clara",
        "tone": "professional",
        "greeting_message": "Hello, thank you for calling. I'm your AI medical receptionist. I can help you schedule an appointment, answer questions about our services, or provide any other information you need.",
        "system_prompt": "You are a friendly and professional front desk receptionist for a medical clinic. Greet patients warmly, collect their information (name, DOB, phone, email, insurance), check doctor availability, and book appointments. Be efficient but caring. Always confirm details before finalizing.",
        "is_predefined": True,
    },
    {
        "name": "Emergency Triage",
        "voice": "Serious",
        "tone": "professional",
        "greeting_message": "This is the emergency assistance line. Please describe your emergency calmly. Help is on the way.",
        "system_prompt": "You are an emergency triage assistant. Quickly assess the severity of the situation. If life-threatening, immediately advise calling 999 and dispatch ambulance. Collect patient location, symptoms, and urgency level. Stay calm and reassuring.",
        "is_predefined": True,
    },
    {
        "name": "General Health Consultant",
        "voice": "Clara",
        "tone": "friendly",
        "greeting_message": "Hello! I'm your general health consultant. How can I help you today?",
        "system_prompt": "You are a general health consultant AI. Answer common health questions, provide information about symptoms, suggest when to see a doctor, and book general consultation appointments. Do NOT diagnose or prescribe. Always recommend consulting a doctor for serious concerns.",
        "is_predefined": True,
    },
    {
        "name": "Pediatric Care",
        "voice": "Warm",
        "tone": "friendly",
        "greeting_message": "Hello! I'm here to help with your child's health needs. How can I assist you today?",
        "system_prompt": "You are a pediatric care assistant. Help parents book appointments for their children, answer questions about childhood vaccines, growth milestones, and common childhood illnesses. Be warm and reassuring. Always ask for the child's age and weight when relevant.",
        "is_predefined": True,
    },
    {
        "name": "Nutrition & Diet",
        "voice": "Clara",
        "tone": "friendly",
        "greeting_message": "Hi there! I'm your nutrition and diet consultant. Ready to help you with your health and wellness goals!",
        "system_prompt": "You are a nutrition and diet consultant AI. Provide general dietary advice, help book appointments with nutritionists, answer questions about meal plans, weight management, and dietary restrictions. Do NOT prescribe extreme diets or medical nutrition therapy without doctor approval.",
        "is_predefined": True,
    },
    {
        "name": "Mental Health Support",
        "voice": "Gentle",
        "tone": "friendly",
        "greeting_message": "Hello. I'm here to support your mental wellbeing. How are you feeling today?",
        "system_prompt": "You are a mental health support assistant. Provide a listening ear, offer coping strategies, help book counseling appointments, and provide crisis hotline information. Be empathetic, non-judgmental, and patient. If someone expresses suicidal thoughts, immediately provide crisis resources.",
        "is_predefined": True,
    },
    {
        "name": "Dental Care",
        "voice": "Clara",
        "tone": "professional",
        "greeting_message": "Welcome to our dental care line. How can I help you with your dental health today?",
        "system_prompt": "You are a dental care assistant. Help patients book dental appointments, answer questions about oral hygiene, common dental procedures, and post-treatment care. Provide information about teeth cleaning, fillings, extractions, and orthodontic consultations.",
        "is_predefined": True,
    },
    {
        "name": "Follow-up & Reminders",
        "voice": "Clara",
        "tone": "friendly",
        "greeting_message": "Hi! This is your follow-up care assistant. I'm here to check on your recovery and help with any post-appointment needs.",
        "system_prompt": "You are a follow-up care assistant. Call patients after their appointments to check on recovery, remind them of follow-up visits, collect feedback, and reschedule missed appointments. Be caring and encouraging. Ask about medication adherence and side effects.",
        "is_predefined": True,
    },
]


# ── Schemas ───────────────────────────────────────────────────────────────────
class AgentCreate(BaseModel):
    name: str
    voice: str = "Clara"
    tone: str = "professional"
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    voice: Optional[str] = None
    tone: Optional[str] = None
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    voice: str
    tone: str
    greeting_message: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: bool
    is_predefined: bool
    service_ids: list[str] = []

    model_config = {"from_attributes": True}


class AssignServicesBody(BaseModel):
    service_ids: list[str]


# ── Helpers ───────────────────────────────────────────────────────────────────
async def _seed_predefined_agents(clinic_id: str, db: AsyncSession):
    """Seed the 8 pre-defined agents for a new clinic if not already seeded."""
    result = await db.execute(
        select(Agent).where(Agent.clinic_id == clinic_id, Agent.is_predefined == True)
    )
    existing = result.scalars().first()
    if existing:
        return  # Already seeded

    for data in PREDEFINED_AGENTS:
        agent = Agent(clinic_id=clinic_id, **data)
        db.add(agent)
    await db.flush()


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all agents for the clinic, seeding pre-defined agents if first time."""
    await _seed_predefined_agents(current_user.clinic_id, db)

    result = await db.execute(
        select(Agent).where(Agent.clinic_id == current_user.clinic_id).order_by(Agent.is_predefined.desc(), Agent.name)
    )
    agents = result.scalars().all()

    # Load service assignments
    agent_ids = [a.id for a in agents]
    if agent_ids:
        assigns = await db.execute(
            select(AgentService).where(AgentService.agent_id.in_(agent_ids))
        )
        assign_map: dict[str, list[str]] = {}
        for a in assigns.scalars().all():
            assign_map.setdefault(a.agent_id, []).append(a.service_id)

    resp = []
    for a in agents:
        data = AgentResponse.model_validate(a)
        data.service_ids = assign_map.get(a.id, [])
        resp.append(data)
    return resp


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(
    body: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = Agent(
        clinic_id=current_user.clinic_id,
        name=body.name,
        voice=body.voice,
        tone=body.tone,
        greeting_message=body.greeting_message,
        system_prompt=body.system_prompt,
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return AgentResponse.model_validate(agent)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.clinic_id == current_user.clinic_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    assigns = await db.execute(
        select(AgentService).where(AgentService.agent_id == agent_id)
    )
    resp = AgentResponse.model_validate(agent)
    resp.service_ids = [a.service_id for a in assigns.scalars().all()]
    return resp


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    body: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.clinic_id == current_user.clinic_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(agent, key, val)
    await db.flush()
    await db.refresh(agent)

    assigns = await db.execute(
        select(AgentService).where(AgentService.agent_id == agent_id)
    )
    resp = AgentResponse.model_validate(agent)
    resp.service_ids = [a.service_id for a in assigns.scalars().all()]
    return resp


@router.delete("/{agent_id}")
async def delete_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.clinic_id == current_user.clinic_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.is_predefined:
        raise HTTPException(status_code=400, detail="Cannot delete pre-defined agents")
    await db.delete(agent)
    await db.flush()
    return {"message": "Agent deleted"}


@router.patch("/{agent_id}/toggle")
async def toggle_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle agent active/inactive status."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.clinic_id == current_user.clinic_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.is_active = not agent.is_active
    await db.flush()
    return {"is_active": agent.is_active}


@router.post("/{agent_id}/services")
async def assign_services(
    agent_id: str,
    body: AssignServicesBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign services to an agent (replaces all existing assignments)."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.clinic_id == current_user.clinic_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Remove existing assignments
    await db.execute(delete(AgentService).where(AgentService.agent_id == agent_id))

    # Add new assignments
    for sid in body.service_ids:
        # Verify service exists and belongs to clinic
        svc_result = await db.execute(
            select(Service).where(Service.id == sid, Service.clinic_id == current_user.clinic_id)
        )
        if not svc_result.scalar_one_or_none():
            continue  # Skip invalid services silently
        db.add(AgentService(agent_id=agent_id, service_id=sid))

    await db.flush()
    return {"message": "Services assigned", "service_ids": body.service_ids}
