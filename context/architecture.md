# Architecture Context

## Stack

| Layer          | Technology                                    | Role                                                        |
| -------------- | --------------------------------------------- | ----------------------------------------------------------- |
| AI/LLM         | Gemini 2.0 Flash                              | Multi-turn healthcare conversation with tool calling        |
| Speech-to-Text | Google Cloud Speech-to-Text                   | Bangla (bn-BD) + English, streaming recognition (8kHz mulaw)|
| Text-to-Speech | Google Cloud Text-to-Speech                   | Bangla (bn-BD-Standard-A) + English (en-US-Neural2-F)      |
| Telephony      | Twilio Media Streams + WebSocket              | Real-time audio streaming from phone calls                  |
| Framework      | FastAPI (Python 3.13)                         | Async REST API + WebSocket, OpenAPI docs                    |
| Frontend       | Next.js 16 + React 19 + TypeScript            | SSR-capable dashboard (all pages "use client")              |
| UI             | Tailwind CSS v4 + Lucide React + Framer Motion| Dark theme, utility-first CSS, icons, animations            |
| Auth           | OTP via phone (bcrypt) + JWT                  | Clinic staff auth, 3 roles: ADMIN/RECEPTIONIST/DOCTOR       |
| Database       | PostgreSQL 18 + SQLAlchemy 2.0 async          | Relational data with UUID PKs, JSON fields, enums           |
| Cache          | Redis                                         | Session cache, rate limiting, bKash/API token cache         |
| Payments       | bKash Tokenized Checkout API                  | BD mobile payments, refunds, transaction queries            |
| SMS            | Twilio + SSL Wireless (fallback)              | BD carrier SMS with Unicode Bangla support                  |
| Testing        | pytest + httpx + AsyncMock                    | Unit/integration tests with in-memory SQLite                |
| State Mgmt     | zustand                                       | Lightweight React client-side state                         |
| Server State   | TanStack Query                                | API caching, refetching, optimistic updates                 |
| Forms          | react-hook-form + zod                         | Type-safe form validation with schema                       |
| Charts         | recharts                                      | Analytics dashboard visualizations                          |

## AI Voice Agent Pipeline

```
Inbound Call (Twilio Phone Number)
  │
  ▼
POST /webhooks/call/incoming/{clinic_id}
  │  Returns TwiML → starts Media Stream
  ▼
WebSocket /webhooks/stream/{clinic_id}
  │  Real-time audio (mulaw 8kHz)
  ▼
┌─────────────────────────────────────────────────┐
│           Voice Agent Pipeline                   │
│                                                  │
│  1. Audio Chunk arrives from Twilio              │
│  2. STT (Google Cloud Speech-to-Text)            │
│     → Bangla (bn-BD) with English fallback       │
│  3. Voice Enhancements Layer:                    │
│     → Sentiment analysis (pos/neg/neutral/urgent)│
│     → Intent recognition (8 medical intents)     │
│     → Dialect normalization (Sylheti, etc.)      │
│  4. LLM (Gemini 2.0 Flash):                     │
│     → Context-aware multi-turn conversation      │
│     → Tool calling (book/check/pay/emergency)    │
│  5. TTS (Google Cloud Text-to-Speech):          │
│     → Generate audio response                    │
│     → Return mulaw audio to Twilio               │
│                                                  │
│  Supporting Services:                            │
│  → Symptom Matcher (symptom → specialty → doctor)│
│  → bKash Service (payment initiation/execution)  │
│  → SMS Service (confirmations, reminders)        │
└─────────────────────────────────────────────────┘
```

## System Boundaries

- `backend/main.py` — FastAPI app entrypoint: lifespan, middleware, router registration, health endpoints
- `backend/voice/` — Voice agent pipeline orchestration (STT → LLM → TTS)
- `backend/models/` — SQLAlchemy ORM models with enums, relationships, computed properties (21 models across 12 files)
- `backend/routers/` — API route handlers with Pydantic request/response models, auth, error handling (17 router files)
- `backend/services/` — Business logic layer: pure async functions, no HTTP dependencies (18 service files)
- `backend/tests/` — pytest test suite (144 tests) with conftest fixtures and AsyncMock patterns
- `backend/db/` — Database engine, session factory, init_db, get_db dependency
- `backend/config.py` — Centralized settings from environment variables
- `frontend/app/` — Next.js App Router pages and layouts (7 pages: /, /login, /dashboard, /appointments, /calls, /analytics, /settings)
- `frontend/lib/` — Shared stores (zustand), providers (TanStack Query), utils (cn from clsx + twMerge)
- `context/` — Project context files for AI-assisted development

## Storage Model

- **PostgreSQL (21 tables)**: All structured healthcare data:
  - `clinics`, `users`, `doctors`, `patients` — Core entities
  - `appointments`, `call_logs` — Scheduling & communication
  - `invoices`, `insurance_claims` — Billing & payments
  - `medical_records`, `vital_signs`, `diagnoses`, `prescriptions`, `allergies`, `immunizations`, `family_history` — EHR
  - `lab_tests`, `lab_orders`, `lab_results`, `imaging_studies` — Lab
  - `pharmacy_orders`, `pharmacy_order_items` — Pharmacy
  - `emergency_cases`, `ambulance_dispatches` — Emergency
  - `telemedicine_sessions` — Telemedicine
  - `inventory_items`, `inventory_transactions`, `medical_supplies`, `equipment` — Inventory
  - `doctor_schedules`, `shift_overrides`, `unavailability` — Staff scheduling
  - `waiting_list`, `recurring_appointment_templates`, `group_bookings`, `questionnaires` — Advanced appointments
- **JSON columns**: Flexible schemas for working_hours, available_slots, symptom_keywords, transcript, line_items, questions, responses, vital_signs, symptoms, reference_ranges, image_urls
- **Environment config**: `.env` file for secrets (database URL, API keys, Twilio creds, bKash creds, Google Cloud creds)

## Auth and Access Model

- **Authentication**: Phone OTP login. User enters phone → receives 4-digit OTP → verifies → gets JWT (bcrypt hashed, 5-min expiry)
- **Ownership**: Every entity scoped to `clinic_id`. User belongs to one clinic. All queries filter by `current_user.clinic_id`
- **Access Control**: Three roles — ADMIN (full access), RECEPTIONIST (appointments, patients, calls), DOCTOR (own schedule, EHR)
- **API Security**: JWT Bearer token via `Authorization` header. `get_current_user` dependency validates and returns user. Twilio requests validated by signature

## Invariants

1. All data queries must be scoped to `clinic_id` — never return data across clinics
2. Request handlers (routers) do not contain business logic — delegate to services
3. Voice processing pipeline never blocks the HTTP request handler (async WebSocket)
4. All user-facing text supports bilingual fields (English + Bangla) where applicable
5. Friday 12:00 PM - 2:00 PM is always blocked for appointments (Jumma prayer guard)
6. Frontend pages must never import server-only Node.js modules (all pages are "use client")
7. Every feature has both backend API endpoints and a corresponding frontend page
8. AI agent conversations maintain context across turns with sentiment-aware responses
