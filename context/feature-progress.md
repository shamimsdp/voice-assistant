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
| **Support** | ✅ DONE | `POST/GET /api/support/tickets`, `PATCH /api/support/tickets/{id}`, `POST /api/support/tickets/{id}/comments` | `/support` split-panel: ticket list, detail with comments, create modal, status actions | Ticketing/help system for clinic staff |

---

## SETUP

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **AI Agents** | ✅ DONE | `GET/POST /api/agents/*`, `PUT/DELETE /api/agents/{id}`, `PATCH /api/agents/{id}/toggle`, `POST /api/agents/{id}/services` | `/agents` | 8 pre-defined agents + custom creation, activation toggle, service assignment, voice/tone/greeting/prompt config |
| **Services** | ✅ DONE | `GET/POST /api/services/*`, `PUT/DELETE /api/services/{id}` | `/services` | Service catalog with categories (14 types), duration, pricing CRUD, search + category filter |
| **Knowledge** | ✅ DONE | `GET /api/knowledge/categories`, `POST/GET/PATCH/DELETE /api/knowledge` | `/knowledge` split-panel: search, category filter, create/edit/delete, bilingual content, tags |
| **Website** | ✅ DONE | `GET/PUT /api/website`, `GET /api/website/public/{clinic_id}` | `/website` form-based builder with sections (Hero, About, Contact, Hours, Visibility), `/clinic/{id}` public landing page with white theme | Clinic website builder or landing page config (hours, doctors, contact info) |

---

## ACCOUNT

| Feature | Status | Backend | Frontend | Notes |
|---------|--------|---------|----------|-------|
| **Notifications** | ✅ DONE | `notification_service.py` — CRUD + `sms_service.py` — Twilio/SSL Wireless; `PATCH /api/notifications/{id}/read`, `POST /api/notifications/read-all`, `GET /api/notifications/unread-count`, `GET /api/notifications`, `POST /api/notifications` | `/notifications` with full list, type filter, unread filter, mark read, mark all read. Bell dropdown with unread count badge, auto-refresh 30s. Loading/error/empty states. | Need a notification center: in-app toast/notification center, configurable SMS/email triggers, notification history |
| **Settings** | ✅ DONE | `GET/PATCH /api/clinics/me`, `GET/POST /api/clinics/doctors` | `/settings` | Clinic info, localization guards, SMS gateway, voice persona, doctor toggles |

---

## EXTRA — Already Built Backend Features (Need Frontend)

These are fully functional backend APIs that have **no frontend pages yet**.

| Module | API Prefix | Endpoints | What Frontend Needs |
|--------|-----------|-----------|---------------------|
| **EHR / Medical Records** | ✅ DONE | `/api/ehr/*` — 12 endpoints | `/patients/{id}` with 8-tab detail page (Summary, Records, Vitals, Diagnoses, Prescriptions, Allergies, Immunizations, Family History) |
| **Pharmacy / Dispensary** | ✅ DONE | `/api/pharmacy/*` — 4 endpoints | `/pharmacy` with order list, create order, add items, dispense |
| **Lab Integration** | ✅ DONE | `/api/lab/*` — 9 endpoints | `/lab` with test catalog, orders + results, imaging studies |
| **Emergency & Triage** | ✅ DONE | `/api/emergency/*` — 6 endpoints | `/emergency` with cases list, triage badges, detail expand, ambulance dispatch |
| **Telemedicine** | ✅ DONE | `/api/telemedicine/*` — 3 endpoints | `/telemedicine` with session list, schedule modal, status actions |
| **Inventory** | ✅ DONE | `/api/inventory/*` — 9 endpoints | `/inventory` with items table, stock alerts, transactions, supplies, equipment tabs |
| **Staff Scheduling** | `/api/staff-scheduling/*` | 7 endpoints — weekly schedules, availability, time-off, overrides | Doctor schedule view + time-off request page |
| **Invoice / Billing** | ✅ DONE | `GET /api/payments/*` — 11 endpoints | `/billing` with invoices, payment history, insurance claims, financial report |
| **Advanced Appointments** | `/api/advanced-appointments/*` | 18 endpoints — symptom matching, conflict detection, waiting list, recurring, group bookings, questionnaires | Waiting list management, recurring templates, group booking, pre-visit questionnaires |
| **Analytics v2** | `/api/analytics/v2/*` | 8 endpoints — full KPIs, demographics, trends, predictive staffing, outbreak detection, no-show risk, NPS | Extended analytics dashboard with predictive insights |
| **Doctor Management** | ✅ DONE | `GET/POST/DELETE /api/clinics/doctors` | `/doctors` with card grid, search, active/inactive filter, add/edit modal, toggle |

---

## EXTRA — Features Not Built Anywhere

| Feature | Priority | Notes |
|---------|----------|-------|
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
1. **Patients** — ✅ Built: list/search, registration modal, detail slideover
2. **Schedule** — ✅ Built: month calendar, day detail, time-off tab, 3 modals
3. **Doctors** — ✅ Built: card grid, search, add/edit modal, active/inactive toggle
4. **EHR / Medical Records** — ✅ Built: `/patients/{id}` with 8-tab detail page
5. **Inventory** — ✅ Built: items table, stock alerts, transactions, supplies, equipment tabs
6. **Lab** — ✅ Built: test catalog, orders + results, imaging studies
7. **Pharmacy** — ✅ Built: order list, create order, add items, dispense workflow
8. **Billing** — ✅ Built: invoice creation, payment history, insurance claims

### Phase 1b — Connect Existing Pages to Real APIs
9. **Dashboard** — ✅ Connected to `GET /api/analytics/summary`
10. **Appointments** — ✅ Connected to `GET/POST/PATCH/DELETE /api/appointments/*`
11. **Call Logs** — ✅ Connected to `GET /api/calls`, `GET /api/calls/{id}`
12. **Settings** — ✅ Connected to `GET/PATCH /api/clinics/me`, `GET/POST/DELETE /api/clinics/doctors`
13. **Patients** — ✅ Connected to `GET/POST /api/patients`
14. **Doctors** — ✅ Connected to `GET/POST/DELETE /api/clinics/doctors`
15. **Schedule** — ✅ Connected to `GET/POST /api/staff-scheduling/*`
16. **EHR / Medical Records** — ✅ Connected to `/api/ehr/*`
17. **Inventory** — ✅ Connected to `/api/inventory/*`
18. **Lab** — ✅ Connected to `/api/lab/*`
19. **Pharmacy** — ✅ Connected to `/api/pharmacy/*`
20. **Billing** — ✅ Connected to `/api/payments/*`
21. **Services** — ✅ Connected to `/api/services/*`
22. **AI Agents** — ✅ Connected to `/api/agents/*`

### Phase 2 — Medium Complexity
9. **Emergency** — ✅ Built: cases list, triage badges, detail expand, ambulance dispatch
10. **Telemedicine** — ✅ Built: session list, schedule modal, status actions
11. **AI Agents** — ✅ Built: grid, create/edit, toggle, service assignment
12. **Notifications** — In-app notification center, configurable triggers

### Phase 3 — Advanced
12. **Knowledge** — ✅ Built: searchable articles, categories, tags, bilingual
13. **Website** — ✅ Built: form-based builder + public page at `/clinic/{id}`
14. **Support** — ✅ Built: ticketing system with comments, status workflow, create modal
15. **Patient Portal** — ✅ Built: patient auth + portal pages with appointments & invoices

---

## Current App State (June 2026)

**Backend**: 50+ API endpoints across 15 router groups. Full coverage: auth, calls, appointments (basic + advanced), clinics, payments, analytics (v1 + v2), EHR, pharmacy, emergency, telemedicine, lab integration, staff scheduling, inventory, webhooks/streaming.

**Frontend**: 16 pages — Landing (`/`), Login (`/login`), Dashboard (`/dashboard`), Appointments (`/appointments`), Schedule (`/schedule`), Call Logs (`/calls`), Analytics (`/analytics`), Patients (`/patients`), Patient EHR (`/patients/{id}`), Doctors (`/doctors`), Inventory (`/inventory`), Lab (`/lab`), Pharmacy (`/pharmacy`), Billing (`/billing`), Services (`/services`), AI Agents (`/agents`), Settings (`/settings`). All pages connected to real backend APIs. Libraries: Next.js 16, React 19, Tailwind v4, Recharts, react-hook-form + zod, framer-motion, zustand, tanstack/react-query.

**Testing**: 144 passing backend tests (Python/pytest).

**Auth**: OTP via phone + JWT (backend); mock OTP (frontend login page).
