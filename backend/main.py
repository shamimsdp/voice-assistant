"""
main.py — FastAPI application entrypoint
Bangladesh Medical Voice Assistant
"""
import os
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from config import get_settings
from db.base import init_db
from routers import calls, appointments, clinics, payments, auth, webhooks, analytics
from routers.notifications import router as notifications_router
from routers.website import router as website_router
from routers.advanced_appointments import router as advanced_appointments_router
from routers.analytics_v2 import router as analytics_v2_router
from routers.inventory import router as inventory_router
from routers.staff_scheduling import router as staff_scheduling_router
from routers.lab_integration import router as lab_integration_router
from routers.ehr import router as ehr_router
from routers.telemedicine import router as telemedicine_router
from routers.pharmacy import router as pharmacy_router
from routers.emergency import router as emergency_router
from routers.agents import router as agents_router
from routers.services import router as services_router
from routers.patients import router as patients_router

# ── Structured logging ────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if os.getenv("APP_ENV") == "development"
        else structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()
settings = get_settings()


# ── App Lifespan ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Bangladesh Medical Voice Assistant")
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("🛑 Shutting down")


# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Bangladesh Medical Voice Assistant API",
    description=(
        "AI-powered medical receptionist for Bangladeshi clinics. "
        "Supports Bangla/English voice, appointment booking, bKash payments."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.app_env == "production":
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(calls.router,        prefix="/api/calls",        tags=["Voice Calls"])
app.include_router(appointments.router, prefix="/api/appointments",  tags=["Appointments"])
app.include_router(clinics.router,      prefix="/api/clinics",       tags=["Clinics"])
app.include_router(payments.router,     prefix="/api/payments",      tags=["Payments"])
app.include_router(webhooks.router,     prefix="/webhooks",          tags=["Webhooks"])
app.include_router(analytics.router,    prefix="/api/analytics",     tags=["Analytics"])
app.include_router(advanced_appointments_router, prefix="/api/advanced-appointments", tags=["Advanced Appointments"])
app.include_router(analytics_v2_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(inventory_router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(staff_scheduling_router, prefix="/api/staff-scheduling", tags=["Staff Scheduling"])
app.include_router(lab_integration_router, prefix="/api/lab", tags=["Lab Integration"])
app.include_router(ehr_router, prefix="/api/ehr", tags=["EHR"])
app.include_router(telemedicine_router, prefix="/api/telemedicine", tags=["Telemedicine"])
app.include_router(pharmacy_router, prefix="/api/pharmacy", tags=["Pharmacy"])
app.include_router(emergency_router, prefix="/api/emergency", tags=["Emergency"])
app.include_router(agents_router, prefix="/api/agents", tags=["Agents"])
app.include_router(services_router, prefix="/api/services", tags=["Services"])
app.include_router(patients_router, prefix="/api/patients", tags=["Patients"])
app.include_router(notifications_router, prefix="/api", tags=["Notifications"])
app.include_router(website_router, prefix="/api", tags=["Website"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Bangladesh Medical Voice Assistant",
        "version": "1.0.0",
        "status": "operational",
        "supported_languages": ["bn-BD", "en-US"],
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
