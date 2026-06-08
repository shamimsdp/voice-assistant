# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1: High-Value Frontend Pages — **Not started**

## Current Goal

- Build missing frontend pages for features that already have backend APIs

## Completed

### Backend — Core Infrastructure
- FastAPI application with WebSocket endpoints for real-time voice communication
- Database models: 21 models across 12 files (auth, appointments, patients, doctors, clinics, calls, payments, EHR, pharmacy, emergency, telemedicine, lab, inventory, staff scheduling)
- Voice agent: Twilio → STT (Google Cloud) → LLM (Gemini 2.0 Flash) → TTS (Google Cloud) → Twilio pipeline
- bKash payment gateway integration (Tokenized Checkout API)
- SMS service with Twilio + SSL Wireless fallback
- Jumma prayer guard (blocks Fri 12PM-2PM)
- Multilingual support (bn-BD + en-US with automatic switching)

### Backend — Domain Modules (50+ API endpoints)
- Appointments CRUD + advanced (symptom matching, conflict detection, waiting list, recurring, group bookings, questionnaires)
- Analytics v1 (summary, calls-by-day, language breakdown)
- Analytics v2 (KPIs, demographics, trends, predictive staffing, outbreak detection, no-show risk, NPS, smart reminders)
- Clinic profile + doctor management
- Payments (bKash initiate/execute/refund/query), invoices, insurance claims, financial reports
- EHR (medical records, vitals, diagnoses, prescriptions, allergies, immunizations, family history)
- Inventory (items, stock transactions, supplies, equipment)
- Staff scheduling (weekly schedules, availability, time-off, shift overrides)
- Lab integration (test catalog, orders, results, imaging)
- Telemedicine (session scheduling, status management)
- Pharmacy (orders, items, dispense)
- Emergency (cases, ambulance dispatch)
- Authentication (OTP request/verify, JWT, user profile)

### Testing
- 144 passing backend tests (pytest)
- Test patterns established: model property tests, service logic with AsyncMock, edge case coverage

### Frontend — Pages
- Landing page (`/`) — Marketing hero with interactive Bangla AI demo simulator
- Login (`/login`) — Two-step phone OTP flow with simulated SMS banner
- Dashboard (`/dashboard`) — Stat cards, live call monitor, appointment queue
- Appointments (`/appointments`) — Full table with Zod-validated booking modal
- Call Logs (`/calls`) — Split-panel transcript viewer with sentiment filtering
- Analytics (`/analytics`) — Recharts BarChart + LineChart, latency cards, sentiment bars
- Settings (`/settings`) — Clinic config, localization guards, SMS gateway, AI persona, doctor toggles

### Libraries Integrated
- Frontend: zustand, TanStack Query, Recharts, react-hook-form + zod, framer-motion, date-fns, clsx + tailwind-merge
- All pages use framer-motion animations (stagger, fade, scale, hover)

### Documentation
- `feature-progress.md` — Feature status tracker (updated)
- `feature-list.md` — Complete feature specification (all endpoints, models, frontend needs)
- `context/*.md` — 6 project context files (architecture, code standards, UI, workflow, progress, overview)
- `.opencode/agents/feature-builder.md` — Autonomous feature implementation agent
- `opencode.json` — Project-level opencode configuration

## In Progress

- None yet.

## Next Up

### Phase 1 — High-Value Frontend Pages (backends already built)
1. **Patients** — List/search, registration form, detail page with EHR tabs (records, vitals, diagnoses, prescriptions, allergies, immunizations)
2. **Schedule** — Weekly doctor schedule view, availability checker, time-off request/approve forms
3. **Inventory** — Items list, stock transactions, supplies, equipment with alert-level indicators
4. **Pharmacy** — Order management, add items, dispense workflow
5. **Lab** — Test catalog, order lab tests, view results with reference ranges
6. **Billing** — Invoice list, payment history, insurance claims, financial reports

### Phase 2 — Connect Existing Pages to Real APIs
7. Dashboard → `GET /api/analytics/summary`
8. Analytics → `GET /api/analytics/*` and `GET /api/analytics/v2/*`
9. Appointments → `GET/POST/PATCH/DELETE /api/appointments/*`
10. Call Logs → `GET /api/calls`, `GET /api/calls/{id}`
11. Settings → `GET/PATCH /api/clinics/me`, `GET/POST/DELETE /api/clinics/doctors`
12. Login → `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`

### Phase 3 — Medium Complexity
13. Emergency — ER cases dashboard, ambulance dispatch
14. Telemedicine — Session scheduling, video call integration
15. Doctor Management — Full CRUD page
16. Staff Scheduling — Calendar view with approval workflows
17. AI Agents — Dedicated config page (prompts, intents, model selection)
18. Notifications — In-app notification center with bell icon

### Phase 4 — Advanced / New Builds
19. Knowledge Base — Searchable medical FAQ/protocols
20. Support — Internal ticketing system
21. Patient Portal — Patient self-service login
22. Website — Clinic public page config

## Open Questions

- Should the Patients page show only active patients or include soft-deleted ones?
- What fields are needed for patient registration form beyond phone, name, DOB, gender?
- Should Inventory items be directly linked to Pharmacy orders via inventory_item_id?
- What's the preferred video call provider for Telemedicine? (currently "internal")

## Architecture Decisions

- **Separate model files per domain** — Keeps models organized and maintainable as the schema grows (e.g., `clinic_operations.py`, `ehr.py`, `lab_integration.py` instead of one giant `models.py`)
- **In-memory SQLite for tests** — Fast, isolated, no external DB dependency for CI. Uses `sqlite+aiosqlite:///:memory:`
- **AsyncMock for service tests** — Avoids needing a real database session. Pure unit tests for service logic.
- **Frontend mock data first** — All pages currently use hardcoded data. Real API integration is deferred to Phase 2 to iterate UI faster.
- **"use client" for all pages** — Framer-motion animation hooks and React state require client-side rendering. No benefit from server components for this dashboard.
- **BD phone validation** — Regex `/^01[3-9]\d{8}$/` validates Bangladeshi mobile numbers (11 digits starting with 01 followed by 3-9).

## Session Notes

- 2026-06-08: Initial project setup with FastAPI backend + Next.js frontend
- 2026-06-08: Built all backend features (#4 Clinic Operations: inventory, staff scheduling, lab) and (#5 Integration & Expansion: EHR, telemedicine, pharmacy, emergency)
- 2026-06-08: Installed frontend libraries (zustand, TanStack Query, recharts, react-hook-form + zod, framer-motion)
- 2026-06-08: Integrated recharts into analytics page, Zod validation into appointments form, framer-motion into all pages
- 2026-06-08: Created feature-list.md and updated feature-progress.md with comprehensive specs
- 2026-06-08: Created feature-builder subagent, project context folder with 6 files, and skills
