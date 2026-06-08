# Feature Progress & Roadmap

## Legend
- ✅ **DONE** — Backend + Frontend both complete
- 🟡 **API DONE** — Backend API exists, no frontend page yet
- 🟠 **PARTIAL** — Partial implementation
- ❌ **NOT STARTED** — Not built anywhere

---

## CLINICAL

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **Overview (Dashboard)** | ✅ DONE | `GET /api/analytics/summary` | `/dashboard` | Stat cards, live call monitor, appointment queue |
| **Analytics** | ✅ DONE | `GET /api/analytics/*`, `GET /api/analytics/v2/*` | `/analytics` | KPIs, trends, demographics, latency, sentiment, recharts |
| **Call Log** | ✅ DONE | `GET /api/calls`, `GET /api/calls/{id}` | `/calls` | Transcripts, sentiment filtering, audio waveform |
| **Appointments** | ✅ DONE | `GET/POST /api/appointments/*`, `GET/POST /api/advanced-appointments/*` | `/appointments` | CRUD, filters, booking modal with zod validation |
| **Schedule** | ✅ DONE | `staff_scheduling_service.py` — weekly schedules, availability, time-off, shift overrides (`/api/staff-scheduling/*`) | `/schedule` | Month calendar grid, day detail panel, time-off tab, book/create/time-off modals |
| **Patients** | ✅ DONE | `Patient` model with `clinic_id` + `email`, `GET/POST/PUT/DELETE /api/patients` | `/patients` | Patient list with search, registration modal, detail slideover |
| **Support** | ❌ NOT STARTED | — | ❌ Not started | Ticketing/help system for clinic staff |

---

## SETUP

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **AI Agents** | ✅ DONE | `GET/POST /api/agents/*`, `PUT/DELETE /api/agents/{id}`, `PATCH /api/agents/{id}/toggle`, `POST /api/agents/{id}/services` | `/agents` | 8 pre-defined agents + custom creation, activation toggle, service assignment, voice/tone/greeting/prompt config |
| **Services** | ✅ DONE | `GET/POST /api/services/*`, `PUT/DELETE /api/services/{id}` | `/services` | Service catalog with categories (14 types), duration, pricing CRUD, search + category filter |
| **Knowledge** | ❌ NOT STARTED | — | ❌ Not started | FAQ/Q&A knowledge base for AI agents — predefined + custom Q&A by category |
| **Website** | ❌ NOT STARTED | — | ❌ Not started | Clinic website builder or landing page config (hours, doctors, contact info) |

---

## ACCOUNT

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **Notifications** | 🟠 PARTIAL | `sms_service.py` — SMS confirmations/reminders; analytics has smart reminders, no-show risk | Per-appointment SMS trigger in `/appointments` only | Need a notification center: in-app toast/notification center, configurable SMS/email triggers, notification history |
| **Settings** | ✅ DONE | `GET/PATCH /api/clinics/me`, `GET/POST /api/clinics/doctors` | `/settings` | Clinic info, localization guards, SMS gateway, voice persona, doctor toggles |

---

## EXTRA — Already Built Backend Features (Need Frontend)

These are fully functional backend APIs that have **no frontend pages yet**.

| Module | API Prefix | Endpoints | What Frontend Needs |
|--------|-----------|-----------|---------------------|
| **EHR / Medical Records** | ✅ DONE | `/api/ehr/*` — 12 endpoints | `/patients/{id}` with 8-tab detail page (Summary, Records, Vitals, Diagnoses, Prescriptions, Allergies, Immunizations, Family History) |
| **Pharmacy / Dispensary** | `/api/pharmacy/*` | 4 endpoints — order creation, listing, items, dispense | Pharmacy order management page |
| **Lab Integration** | `/api/lab/*` | 9 endpoints — test catalog, orders, results, imaging | Lab ordering + results viewing page |
| **Emergency & Triage** | `/api/emergency/*` | 6 endpoints — cases, ambulance dispatch | Emergency dashboard + case detail page |
| **Telemedicine** | `/api/telemedicine/*` | 3 endpoints — sessions, listing, status | Telemedicine scheduling + video call join page |
| **Inventory** | `/api/inventory/*` | 9 endpoints — items, stock, transactions, supplies, equipment | Inventory management page with stock alerts |
| **Staff Scheduling** | `/api/staff-scheduling/*` | 7 endpoints — weekly schedules, availability, time-off, overrides | Doctor schedule view + time-off request page |
| **Invoice / Billing** | `/api/payments/*` | 11 endpoints — invoices, insurance claims, financial reports, payment history | Billing page with invoice creation + payment history |
| **Advanced Appointments** | `/api/advanced-appointments/*` | 18 endpoints — symptom matching, conflict detection, waiting list, recurring, group bookings, questionnaires | Waiting list management, recurring templates, group booking, pre-visit questionnaires |
| **Analytics v2** | `/api/analytics/v2/*` | 8 endpoints — full KPIs, demographics, trends, predictive staffing, outbreak detection, no-show risk, NPS | Extended analytics dashboard with predictive insights |
| **Doctor Management** | ✅ DONE | `GET/POST/DELETE /api/clinics/doctors` | `/doctors` with card grid, search, active/inactive filter, add/edit modal, toggle |

---

## EXTRA — Features Not Built Anywhere

| Feature | Priority | Notes |
|---------|----------|-------|
| **Patient Portal** | Medium | Patient self-service login (view appointments, pay bills, chat with AI) |
| **Role-Based Access Control (UI)** | Medium | Admin/Receptionist/Doctor views differ; backend has `UserRole` enum but frontend ignores it |
| **Reports / Export** | Low | CSV/PDF export for appointments, payments, analytics |
| **Audit Log** | Low | Track who changed what in the system |
| **Multi-Clinic Admin** | Low | Super-admin dashboard across clinics |
| **Staff Attendance** | Low | Clock-in/out tracking |
| **Referral Management** | Low | Inter-doctor or inter-clinic referrals |
| **Ward / Bed Management** | Low | Inpatient management |
| **HL7 / FHIR** | Low | Healthcare interoperability standards |
| **Knowledge Base UI** | Low | Manage FAQs, protocols that the AI agent can reference |

---

## Build Order (Suggested)

### Phase 1 — High-Value Frontend Pages (backends already built)
1. **Patients** — ✅ Built: list/search, register modal, detail slideover
2. **Schedule** — ✅ Built: month calendar, day detail, time-off tab, 3 modals
3. **Doctors** — ✅ Built: card grid, search, add/edit modal, active/inactive toggle
4. **EHR / Medical Records** — ✅ Built: `/patients/{id}` with 8-tab detail page
5. **Pharmacy** — Order list, create/manage pharmacy orders
6. **Lab** — Test catalog, order lab tests, view results
7. **Inventory** — Stock levels, transactions, alerts

### Phase 2 — Medium Complexity
8. **Emergency** — Emergency cases dashboard, ambulance dispatch
9. **Telemedicine** — Session scheduling, video call integration
10. **Billing** — Invoice creation, payment history, insurance claims
11. **AI Agents** — ✅ Built: grid, create/edit, toggle, service assignment
12. **Notifications** — In-app notification center, configurable triggers

### Phase 3 — Advanced
12. **Knowledge** — Medical knowledge base management
13. **Website** — Clinic public website config
14. **Support** — Internal ticketing system
15. **Patient Portal** — Patient self-service login

---

## Current App State (June 2026)

**Backend**: 50+ API endpoints across 15 router groups. Full coverage: auth, calls, appointments (basic + advanced), clinics, payments, analytics (v1 + v2), EHR, pharmacy, emergency, telemedicine, lab integration, staff scheduling, inventory, webhooks/streaming.

**Frontend**: 12 pages — Landing (`/`), Login (`/login`), Dashboard (`/dashboard`), Appointments (`/appointments`), Schedule (`/schedule`), Call Logs (`/calls`), Analytics (`/analytics`), Patients (`/patients`), Patient EHR (`/patients/{id}`), Doctors (`/doctors`), Services (`/services`), AI Agents (`/agents`), Settings (`/settings`). Libraries: Next.js 16, React 19, Tailwind v4, Recharts, react-hook-form + zod, framer-motion, zustand, tanstack/react-query.

**Testing**: 144 passing backend tests (Python/pytest).

**Auth**: OTP via phone + JWT (backend); mock OTP (frontend login page).
