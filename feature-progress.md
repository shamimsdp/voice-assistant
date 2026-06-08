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
| **Schedule** | 🟡 API DONE | `staff_scheduling_service.py` — weekly schedules, availability, time-off, shift overrides (`/api/staff-scheduling/*`) | ❌ Not started | Need a doctor schedule view + time-off request UI |
| **Patients** | 🟡 API DONE | `Patient` model exists, EHR service has patient summary (`/api/ehr/patients/{id}/summary`) | ❌ Not started | Need patient list, registration, search, detail/history page |
| **Support** | ❌ NOT STARTED | — | ❌ Not started | Ticketing/help system for clinic staff |

---

## SETUP

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **AI Agents** | 🟠 PARTIAL | `gemini_service.py`, `voice_enhancements.py`, `symptom_matcher.py` — full voice pipeline | Voice tone selector in `/settings` only | Need a dedicated agent config page: prompt tuning, intent mapping, language model selection, fallback behaviors |
| **Services** | 🟡 API DONE | Lab, pharmacy, telemedicine, emergency services all built | ❌ Not started | Need pages for configuring clinic services (lab test catalog, pharmacy pricing, telemedicine settings, emergency protocols) |
| **Knowledge** | ❌ NOT STARTED | — | ❌ Not started | Medical knowledge base, FAQ management, clinic protocol docs — could feed into AI agent responses |
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
| **EHR / Medical Records** | `/api/ehr/*` | 12 endpoints — records, vitals, diagnoses, prescriptions, allergies, immunizations, family history, patient summary | Patient detail page with tabs for each record type |
| **Pharmacy / Dispensary** | `/api/pharmacy/*` | 4 endpoints — order creation, listing, items, dispense | Pharmacy order management page |
| **Lab Integration** | `/api/lab/*` | 9 endpoints — test catalog, orders, results, imaging | Lab ordering + results viewing page |
| **Emergency & Triage** | `/api/emergency/*` | 6 endpoints — cases, ambulance dispatch | Emergency dashboard + case detail page |
| **Telemedicine** | `/api/telemedicine/*` | 3 endpoints — sessions, listing, status | Telemedicine scheduling + video call join page |
| **Inventory** | `/api/inventory/*` | 9 endpoints — items, stock, transactions, supplies, equipment | Inventory management page with stock alerts |
| **Staff Scheduling** | `/api/staff-scheduling/*` | 7 endpoints — weekly schedules, availability, time-off, overrides | Doctor schedule view + time-off request page |
| **Invoice / Billing** | `/api/payments/*` | 11 endpoints — invoices, insurance claims, financial reports, payment history | Billing page with invoice creation + payment history |
| **Advanced Appointments** | `/api/advanced-appointments/*` | 18 endpoints — symptom matching, conflict detection, waiting list, recurring, group bookings, questionnaires | Waiting list management, recurring templates, group booking, pre-visit questionnaires |
| **Analytics v2** | `/api/analytics/v2/*` | 8 endpoints — full KPIs, demographics, trends, predictive staffing, outbreak detection, no-show risk, NPS | Extended analytics dashboard with predictive insights |
| **Doctor Management** | `GET/POST/DELETE /api/clinics/doctors` | CRUD for doctors | Doctor list + add/edit page |

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
1. **Patients** — List/search patients, registration form, detail page with EHR tabs
2. **Schedule** — Weekly doctor schedule view, time-off request form
3. **Pharmacy** — Order list, create/manage pharmacy orders
4. **Lab** — Test catalog, order lab tests, view results
5. **Inventory** — Stock levels, transactions, alerts

### Phase 2 — Medium Complexity
6. **Emergency** — Emergency cases dashboard, ambulance dispatch
7. **Telemedicine** — Session scheduling, video call integration
8. **Billing** — Invoice creation, payment history, insurance claims
9. **AI Agents** — Dedicated config page (prompts, intents, model selection)
10. **Notifications** — In-app notification center, configurable triggers

### Phase 3 — Advanced
11. **Knowledge** — Medical knowledge base management
12. **Services** — Configure all clinic services from one page
13. **Website** — Clinic public website config
14. **Support** — Internal ticketing system
15. **Patient Portal** — Patient self-service login

---

## Current App State (June 2026)

**Backend**: 50+ API endpoints across 15 router groups. Full coverage: auth, calls, appointments (basic + advanced), clinics, payments, analytics (v1 + v2), EHR, pharmacy, emergency, telemedicine, lab integration, staff scheduling, inventory, webhooks/streaming.

**Frontend**: 7 pages — Landing (`/`), Login (`/login`), Dashboard (`/dashboard`), Appointments (`/appointments`), Call Logs (`/calls`), Analytics (`/analytics`), Settings (`/settings`). Libraries: Next.js 16, React 19, Tailwind v4, Recharts, react-hook-form + zod, framer-motion, zustand, tanstack/react-query.

**Testing**: 144 passing backend tests (Python/pytest).

**Auth**: OTP via phone + JWT (backend); mock OTP (frontend login page).
