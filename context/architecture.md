# Architecture Context

## Stack

| Layer     | Technology                                    | Role                                                        |
| --------- | --------------------------------------------- | ----------------------------------------------------------- |
| Framework | FastAPI (Python 3.13)                         | Async REST API with WebSocket support, OpenAPI docs         |
| Frontend  | Next.js 16 + React 19 + TypeScript            | SSR-capable dashboard, all pages are "use client"           |
| UI        | Tailwind CSS v4 + Lucide React + Framer Motion| Dark theme, utility-first CSS, icon library, animations     |
| Auth      | OTP via phone (bcrypt hashed) + JWT           | Clinic staff authentication, 3 roles: ADMIN/RECEPTIONIST/DOCTOR |
| Database  | PostgreSQL 18 + SQLAlchemy 2.0 async           | Relational data with UUID PKs, JSON fields, enums           |
| Cache     | Redis                                         | Session cache, rate limiting, bKash token cache             |
| Voice     | Twilio Media Streams + WebSocket              | Real-time audio streaming from phone calls                  |
| STT       | Google Cloud Speech-to-Text                   | Bangla (bn-BD) + English, mulaw 8kHz, streaming recognition |
| LLM       | Gemini 2.0 Flash                              | Multi-turn conversation with tool calling                   |
| TTS       | Google Cloud Text-to-Speech                   | Bangla (bn-BD-Standard-A) + English (en-US-Neural2-F)       |
| Telephony | Twilio                                        | Inbound call handling, TwiML, Media Streams                 |
| Payments  | bKash Tokenized Checkout API                  | BD mobile payments, refunds, transaction queries            |
| SMS       | Twilio + SSL Wireless (fallback)              | BD carrier SMS with Unicode Bangla support                  |
| Testing   | pytest + httpx + AsyncMock                    | Unit/integration tests with in-memory SQLite                |

## System Boundaries

- `backend/main.py` — FastAPI app entrypoint: lifespan, middleware, router registration, health endpoints
- `backend/models/` — SQLAlchemy ORM models with enums, relationships, computed properties
- `backend/routers/` — API route handlers with Pydantic request/response models, auth, error handling
- `backend/services/` — Business logic layer: pure async functions, no HTTP dependencies
- `backend/tests/` — pytest test suite with conftest fixtures
- `backend/voice/` — Voice agent pipeline: STT → Gemini → TTS orchestration
- `backend/db/` — Database engine, session factory, init_db, get_db dependency
- `backend/utils/` — Shared utilities (date helpers, formatting, etc.)
- `frontend/app/` — Next.js App Router pages and layouts
- `frontend/lib/` — Shared stores (zustand), providers (TanStack Query), utils (clsx + twMerge)
- `context/` — Project context files for AI-assisted development

## Storage Model

- **PostgreSQL**: All structured data — users, clinics, patients, appointments, call logs, payments, EHR, inventory, lab orders, pharmacy, emergency, telemedicine, staff schedules
- **JSON columns**: Flexible schemas for: working_hours, available_slots, symptom_keywords, transcript, line_items, questions, responses, vital_signs, symptoms, reference_ranges, image_urls
- **Environment config**: `.env` file for secrets (database URL, API keys, Twilio creds, bKash creds, Google Cloud creds)

## Auth and Access Model

- **Authentication**: Phone OTP login. User enters phone → receives 4-digit OTP → verifies → gets JWT. OTPs stored as bcrypt hash with 5-min expiry.
- **Ownership**: Every entity is scoped to `clinic_id`. A User belongs to one clinic. All queries filter by `current_user.clinic_id`.
- **Access Control**: Three roles — ADMIN (full access), RECEPTIONIST (appointments, patients, calls), DOCTOR (own schedule, EHR). Role-based checks in router endpoints.
- **API Security**: JWT Bearer token via `Authorization` header. `get_current_user` dependency validates token and returns user. Twilio requests validated by signature.

## Invariants

1. All data queries must be scoped to `clinic_id` — never return data across clinics
2. Request handlers (routers) do not contain business logic — delegate to services
3. Voice processing pipeline never blocks the HTTP request handler (async WebSocket)
4. All user-facing text supports bilingual fields (English + Bangla) where applicable
5. Friday 12:00 PM - 2:00 PM is always blocked for appointments (Jumma prayer guard)
6. Frontend pages must never import server-only Node.js modules (all pages are "use client")
7. Every feature has both backend API endpoints and a corresponding frontend page
