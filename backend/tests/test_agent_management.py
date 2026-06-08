"""
Tests for AI Agent Management — Agent, Service, AgentService models
"""
from models.agent import Agent, Service, AgentService
from routers.agents import PREDEFINED_AGENTS


class TestServiceModel:
    def test_create_service(self):
        svc = Service(
            clinic_id="clinic-1",
            name="General Consultation",
            description="General doctor visit",
            duration_min=30,
            price=500.0,
            category="general",
        )
        assert svc.name == "General Consultation"
        assert svc.duration_min == 30
        assert svc.price == 500.0
        assert svc.category == "general"

    def test_service_set_explicit_values(self):
        svc = Service(clinic_id="clinic-1", name="Basic Service", duration_min=45, price=100.0)
        assert svc.duration_min == 45
        assert svc.price == 100.0

    def test_service_category_filter(self):
        svc1 = Service(clinic_id="clinic-1", name="Checkup", category="general")
        svc2 = Service(clinic_id="clinic-1", name="Cleaning", category="dental")
        assert svc1.category == "general"
        assert svc2.category == "dental"


class TestAgentModel:
    def test_create_agent(self):
        agent = Agent(
            clinic_id="clinic-1",
            name="Front Desk Receptionist",
            voice="Clara",
            tone="professional",
            greeting_message="Hello! Welcome to our clinic.",
            system_prompt="You are a front desk receptionist.",
        )
        assert agent.name == "Front Desk Receptionist"
        assert agent.voice == "Clara"
        assert agent.tone == "professional"

    def test_agent_explicit_values(self):
        agent = Agent(clinic_id="clinic-1", name="Test Agent", voice="Custom", tone="friendly", is_active=True)
        assert agent.voice == "Custom"
        assert agent.tone == "friendly"
        assert agent.is_active is True

    def test_toggle_active(self):
        agent = Agent(clinic_id="clinic-1", name="Toggle Test", is_active=False)
        assert agent.is_active is False
        agent.is_active = True
        assert agent.is_active is True

    def test_predefined_agent(self):
        agent = Agent(
            clinic_id="clinic-1",
            name="Emergency Triage",
            is_predefined=True,
            is_active=True,
        )
        assert agent.is_predefined is True
        assert agent.is_active is True


class TestPredefinedAgents:
    def test_eight_predefined_agents(self):
        assert len(PREDEFINED_AGENTS) == 8

    def test_each_has_required_fields(self):
        for data in PREDEFINED_AGENTS:
            assert "name" in data
            assert "voice" in data
            assert "tone" in data
            assert "greeting_message" in data
            assert "system_prompt" in data
            assert data["is_predefined"] is True

    def test_unique_names(self):
        names = [a["name"] for a in PREDEFINED_AGENTS]
        assert len(names) == len(set(names)), "Pre-defined agent names must be unique"

    def test_predefined_names(self):
        expected = {
            "Front Desk Receptionist",
            "Emergency Triage",
            "General Health Consultant",
            "Pediatric Care",
            "Nutrition & Diet",
            "Mental Health Support",
            "Dental Care",
            "Follow-up & Reminders",
        }
        actual = {a["name"] for a in PREDEFINED_AGENTS}
        assert actual == expected


class TestAgentServiceModel:
    def test_create_agent_service(self):
        assign = AgentService(agent_id="agent-1", service_id="service-1")
        assert assign.agent_id == "agent-1"
        assert assign.service_id == "service-1"

    def test_multiple_services_per_agent(self):
        assigns = [
            AgentService(agent_id="agent-1", service_id="s1"),
            AgentService(agent_id="agent-1", service_id="s2"),
            AgentService(agent_id="agent-1", service_id="s3"),
        ]
        assert len(assigns) == 3
        assert all(a.agent_id == "agent-1" for a in assigns)
        assert [a.service_id for a in assigns] == ["s1", "s2", "s3"]


class TestAgentServiceRelationships:
    def test_agent_has_services(self):
        agent = Agent(clinic_id="clinic-1", name="Receptionist")
        svc = Service(clinic_id="clinic-1", name="Checkup")
        assign = AgentService(agent_id=agent.id, service_id=svc.id)
        assert assign.agent_id == agent.id
        assert assign.service_id == svc.id

    def test_service_categories(self):
        categories = ["general", "pediatric", "urgent", "dental", "nutrition", "mental-health", "dermatology", "women-health"]
        services = [Service(clinic_id="c1", name=f"Svc {i}", category=cat) for i, cat in enumerate(categories)]
        assert all(s.category in categories for s in services)
