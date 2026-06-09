# Shasthya Seba AI — Complete Feature Specification

> **Legend:** ✅ = Done | 🟡 = API exists, no frontend | 🟠 = Partial | ❌ = Not started
>
> **Frontend Stack:** Next.js 16 + React 19 + Tailwind v4 + Recharts + react-hook-form/zod + framer-motion + zustand + TanStack Query
> **Backend Stack:** FastAPI + SQLAlchemy 2.0 async + PostgreSQL 18 + Redis + Gemini 2.0 Flash + Google Cloud STT/TTS + Twilio + bKash API

---

## What These Healthcare AI Agents Do

| Capability | How Our System Delivers It |
|------------|---------------------------|
| **Manage patient appointments & scheduling** | AI voice agent books/reschedules/cancels via phone. Dashboard for manual management. Backend: appointment CRUD + advanced (waiting list, recurring, group bookings, conflict detection). |
| **Handle medical inquiries & patient support** | Gemini 2.0 Flash LLM with 8 medical intents, symptom-to-doctor matching, clinic info queries, doctor schedule lookups. |
| **Automate healthcare communication workflows** | SMS service (Twilio + SSL Wireless), smart reminders based on no-show risk, bKash payment links, NPS surveys. |
| **Assist with patient follow-ups & reminders** | No-show risk prediction, automated reminder SMS, follow-up scheduling, immunization due-date tracking. |
| **Improve medical office management & operations** | Full dashboard: EHR, lab orders, pharmacy dispensing, inventory, staff scheduling, billing, emergency coordination. |
| **Support healthcare customer service automation** | 24/7 AI receptionist with sentiment-aware responses, emergency keyword detection, multi-turn conversation. |

## What You'll Learn From This Project

- Build Healthcare AI Voice Agents with modern LLMs (Gemini 2.0 Flash)
- Create real-time medical voice conversations (STT → LLM → TTS pipeline with Twilio)
- Build a Healthcare Management SaaS platform from scratch
- Manage patients, appointments, and medical workflows end-to-end
- Integrate Supabase-style auth (OTP + JWT) and PostgreSQL for healthcare data
- Build scalable medical industry SaaS applications (FastAPI async + SQLAlchemy 2.0)
- Create reusable healthcare AI systems (modular agent architecture with tool calling)
- Build a modern frontend with Next.js 16 + React 19 + Tailwind v4 + framer-motion
- Handle AI prompts, automation, and healthcare business logic
- Manage multi-tenant clinic data with role-based access control

---

## CLINICAL

---

### 1. Overview (Dashboard)

**Status:** ✅ **DONE**

**Description:** Real-time clinic operations dashboard showing key metrics, live call simulation, and today's appointment queue.

#### Backend
| Endpoint | Method | Route | What it returns |
|----------|--------|-------|----------------|
| Dashboard Summary | `GET` | `/api/analytics/summary?days=7` | Total calls, bookings, revenue, avg duration for last N days |
| Real-time Audio | `WS` | `/webhooks/stream/{clinic_id}` | WebSocket for live call audio processing |

**Models used:** `CallLog`, `Appointment`, `Patient`, `Doctor`

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Dashboard | `/dashboard` | 4 stat cards (bookings, calls, success rate, revenue), live call monitor, appointment queue sidebar, audio waveform visualizer | Mock data (no real API integration yet) |

**Missing:** No real API calls — all dashboard data is hardcoded mock. Need to connect stat cards to `GET /api/analytics/summary`.

---

### 2. Analytics

**Status:** ✅ **DONE**

**Description:** Voice pipeline latency breakdown, sentiment analysis, call volume vs bookings charts, peak load analysis, monthly trends.

#### Backend
| Endpoint | Method | Route | What it returns |
|----------|--------|-------|----------------|
| Calls by Day | `GET` | `/api/analytics/calls-by-day?days=14` | Daily call volume for chart rendering |
| Language Breakdown | `GET` | `/api/analytics/language-breakdown?days=30` | Language distribution (bn-BD, en-US, other) |
| KPI Dashboard | `GET` | `/api/analytics/v2/kpi?days=30` | Full KPIs: appointments, calls, revenue, satisfaction |
| Demographics | `GET` | `/api/analytics/v2/demographics` | Age/gender/language distribution |
| Trends | `GET` | `/api/analytics/v2/trends?months=6` | Monthly volume, top specialties, status distribution |
| Predictive Staffing | `GET` | `/api/analytics/v2/predictive-staffing?target_date=` | Optimal staff count recommendation |
| Outbreak Trends | `GET` | `/api/analytics/v2/outbreak-trends?days=30` | Rising symptom keyword alerts |
| No-Show Risk | `GET` | `/api/analytics/v2/appointments/{id}/no-show-risk` | No-show probability (0.0-1.0) |
| Smart Reminder | `POST` | `/api/analytics/v2/appointments/{id}/remind` | Sends risk-based reminder SMS |
| NPS Score | `POST` | `/api/analytics/v2/appointments/{id}/satisfaction` | Submit patient satisfaction score |
| No-Show Summary | `GET` | `/api/analytics/v2/no-show-summary?days=30` | List high-risk appointments |

**Models used:** `CallLog`, `Appointment`, `Patient`, `Doctor`, `Clinic`

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Analytics | `/analytics` | Pipeline latency breakdown, sentiment bars, recharts `BarChart` (calls vs bookings), `LineChart` (monthly trend), peak load heatmap | Mock data (no real API integration yet) |

**Missing:** No real API calls. Charts show static data. Need to connect to `GET /api/analytics/*` and `GET /api/analytics/v2/*`.

---

### 3. Call Log

**Status:** ✅ **DONE**

**Description:** Review patient phone transcripts, conversation sentiments, and extracted intent structures. Split-panel view.

#### Backend
| Endpoint | Method | Route | What it returns |
|----------|--------|-------|----------------|
| List Calls | `GET` | `/api/calls?limit=50&offset=0` | Recent call logs (masked phone, duration, language, booking status) |
| Call Detail | `GET` | `/api/calls/{call_id}` | Full call detail with transcript JSON |

**Models used:** `CallLog`, `Appointment`, `Patient`

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Call Logs | `/calls` | Search + sentiment filter, call log cards with summary/sentiment/language/intent, transcript detail panel with audio waveform mock, AI synopsis card, message bubble list | Mock data (4 hardcoded calls) |

**Missing:** No real API calls. Need to connect to `GET /api/calls`.

---

### 4. Appointments

**Status:** ✅ **DONE**

**Description:** Full appointment CRUD with search/filter, booking modal with Zod validation, status cycling, SMS trigger.

#### Backend
| Endpoint | Method | Route | Parameters | What it does |
|----------|--------|-------|------------|-------------|
| List Appointments | `GET` | `/api/appointments` | Query: `date?`, `status?`, `doctor_id?` | List appointments for current clinic |
| Create Appointment | `POST` | `/api/appointments` | Body: `AppointmentCreate` | Manually create appointment (checks prayer-time blocks) |
| Get Appointment | `GET` | `/api/appointments/{id}` | Path: appointment_id | Single appointment detail |
| Update Appointment | `PATCH` | `/api/appointments/{id}` | Path + Body: `AppointmentUpdate` | Update status/time/notes |
| Cancel Appointment | `DELETE` | `/api/appointments/{id}` | Path: appointment_id | Soft delete / cancel |

**Advanced Appointment Endpoints (extra):**
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Symptom Matching | `POST` | `/api/advanced-appointments/match-doctors` | Maps symptoms to suitable doctors |
| Conflict Detection | `POST` | `/api/advanced-appointments/check-conflicts` | Check scheduling conflicts |
| Available Slots | `GET` | `/api/advanced-appointments/available-slots/{doctor_id}` | Get open slots |
| Duration Estimation | `POST` | `/api/advanced-appointments/estimate-duration` | AI predicts appointment length |
| Waiting List CRUD | `POST/GET/DELETE` | `/api/advanced-appointments/waiting-list*` | Full waiting list management |
| Recurring Templates | `POST/GET/DELETE` | `/api/advanced-appointments/recurring*` | Recurring appointment setup |
| Group Bookings | `POST/GET` | `/api/advanced-appointments/group-bookings*` | Family/vaccination group visits |
| Questionnaires | `POST/GET` | `/api/advanced-appointments/questionnaires*` | Pre-visit questionnaire CRUD |
| Questionnaire Responses | `POST/GET` | `/api/advanced-appointments/questionnaire-responses*` | Submit and view responses |

**Models used:** `Appointment`, `Patient`, `Doctor`, `Clinic`, `WaitingListEntry`, `RecurringAppointmentTemplate`, `GroupBooking`, `GroupBookingMember`, `Questionnaire`, `QuestionnaireResponse`

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Appointments | `/appointments` | Search + doctor/payment filter, full table with columns (ID, Patient, Doctor, Schedule, Fee, Status, SMS, Actions), "Book Appointment" modal with Zod-validated form (BD phone regex), status cycle buttons, SMS trigger buttons | Mock data (7 hardcoded appointments) |

**Missing:** No real API calls. No pages for: waiting list management, recurring appointments, group bookings, questionnaires, symptom matching UI.

---

### 5. Schedule

**Status:** ✅ **DONE**

**Description:** Weekly doctor schedule view, availability checking, time-off requests, shift overrides.

#### Backend
| Endpoint | Method | Route | Parameters | What it does |
|----------|--------|-------|------------|-------------|
| Weekly Schedule | `GET` | `/api/staff-scheduling/weekly-schedule` | Query: `doctor_id?` | Get weekly schedule template |
| Create Schedule | `POST` | `/api/staff-scheduling/schedules` | Body: `CreateScheduleBody` | Add schedule entry |
| Check Availability | `GET` | `/api/staff-scheduling/availability` | Query: `doctor_id`, `target_date` | Is doctor available? |
| Request Time-Off | `POST` | `/api/staff-scheduling/time-off` | Body: `TimeOffRequest` | Staff requests time off |
| Approve/Reject | `POST` | `/api/staff-scheduling/time-off/{id}/approve` | Path + Body: `ApproveTimeOffBody` | Admin approves/rejects |
| List Time-Off | `GET` | `/api/staff-scheduling/time-off` | Query: `status?`, `doctor_id?` | View time-off requests |
| Shift Override | `POST` | `/api/staff-scheduling/overrides` | Body: `CreateOverrideBody` | Create temporary shift change |

**Models used:** `DoctorSchedule`, `ShiftOverride`, `Unavailability`, `Doctor`, `Clinic`
- `DoctorSchedule`: day_of_week (MON-SUN), shift_type (MORNING/AFTERNOON/EVENING/NIGHT/FULL_DAY), start_time, end_time, max_patients, room_number
- `Unavailability`: start_date, end_date, reason (EN+BN), status (PENDING/APPROVED/REJECTED/CANCELLED)
- `ShiftOverride`: shift_date, shift_type, start_time, end_time, override_type, reason

#### Frontend
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Schedule Calendar | `/schedule` | Month calendar grid with day cell details (appointment count, doctor on duty, Jummah indicator). Day detail panel with doctor schedules + appointments list. Time-off tab with approve/reject. Modals: Book appointment, Request time off, Add schedule. | ✅ Built |

---

### 6. Patients

**Status:** 🟡 **API DONE — No frontend**

**Description:** Patient registration, search, detail view with full medical history (EHR).

#### Backend
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Patient Summary | `GET` | `/api/ehr/patients/{patient_id}/summary` | Total visits, chronic diagnoses, active allergies, immunizations, family history |
| Patient Records | `GET` | `/api/ehr/records?patient_id=` | List medical records for a patient |
| Record Detail | `GET` | `/api/ehr/records/{record_id}` | Full record with vitals, diagnoses, prescriptions |
| Add Allergy | `POST` | `/api/ehr/patients/{patient_id}/allergies` | Record an allergy |
| List Allergies | `GET` | `/api/ehr/patients/{patient_id}/allergies` | View all patient allergies |
| Add Immunization | `POST` | `/api/ehr/patients/{patient_id}/immunizations` | Record vaccination |
| List Immunizations | `GET` | `/api/ehr/patients/{patient_id}/immunizations` | View vaccination history |
| Add Family History | `POST` | `/api/ehr/patients/{patient_id}/family-history` | Record family medical history |

**Models used:** `Patient`, `MedicalRecord`, `VitalSign`, `Diagnosis`, `Prescription`, `Allergy`, `Immunization`, `FamilyHistory`
- `Patient`: phone (unique), name (EN+BN), DOB, gender, address, preferred_language
- `MedicalRecord`: visit_date, visit_type (new/follow_up/emergency/routine/telemedicine/home_visit), chief_complaint (EN+BN), HPI, assessment, plan
- `VitalSign`: parameter_name, value, unit (mmHg/bpm/celsius/kg/cm/%/mg/dL)
- `Diagnosis`: diagnosis_name (EN+BN), icd_code, diagnosis_type (primary/secondary/differential/ruled_out)
- `Prescription`: medicine_name (EN+BN), dosage, frequency, duration_days, route, instructions
- `Allergy`: allergen (EN+BN), severity (mild/moderate/severe/life_threatening), reaction
- `Immunization`: vaccine_name (EN+BN), dose_number, administered_date, next_due_date
- `FamilyHistory`: relationship, condition (EN+BN)

#### Frontend
**Needed Pages:**
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Patient List/Search | `/patients` | Searchable table (phone, name, DOB, gender, total visits, last visit). Click to view detail. | High |
| Patient Registration | `/patients/register` | Form: phone (required), name EN/BN, DOB, gender, address, preferred language. Validated with zod. | High |
| Patient Detail | `/patients/{id}` | Tabs layout: Summary, Medical Records, Vitals, Prescriptions, Allergies, Immunizations, Family History | High |
| Medical Record Detail | `/patients/{id}/records/{record_id}` | Full visit record with vitals table, diagnoses list, prescriptions | High |
| New Medical Record | `/patients/{id}/records/new` | Form: visit type, chief complaint (EN+BN), HPI, assessment, plan. Add vitals inline. | High |

---

### 7. Support

**Status:** ❌ **NOT STARTED**

**Description:** Internal ticketing/help system for clinic staff to report issues or request assistance.

#### Backend
Not built. No models, services, or endpoints exist.

**Proposed Model:** `SupportTicket`
| Column | Type |
|--------|------|
| id | UUID PK |
| clinic_id | FK -> clinics |
| created_by | FK -> users |
| subject | String(255) |
| description | Text |
| priority | Enum(LOW/MEDIUM/HIGH/CRITICAL) |
| status | Enum(OPEN/IN_PROGRESS/RESOLVED/CLOSED) |
| assigned_to | FK -> users (nullable) |
| category | String(100) |
| created_at | DateTime |
| resolved_at | DateTime (nullable) |

**Proposed Endpoints:**
| Method | Route | What it does |
|--------|-------|-------------|
| `POST` | `/api/support/tickets` | Create ticket |
| `GET` | `/api/support/tickets` | List tickets (filter by status/priority) |
| `GET` | `/api/support/tickets/{id}` | Get ticket detail |
| `PATCH` | `/api/support/tickets/{id}` | Update ticket (status, assignment) |
| `POST` | `/api/support/tickets/{id}/comments` | Add comment |

#### Frontend
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Support Tickets | `/support` | List view with status badges, priority indicators. Create ticket button. | Low |
| Ticket Detail | `/support/{id}` | Thread view with comments, status update controls | Low |

---

## SETUP

---

### 8. AI Agents

**Status:** ✅ **DONE — Full agent management with 8 pre-defined agents + custom creation**

**Description:** AI voice agent management system. 8 pre-defined agent personas (Front Desk, Emergency, General Health, Pediatric, Nutrition, Mental Health, Dental, Follow-up) plus custom agent creation. Each agent has configurable voice, tone, greeting, system prompt, and service assignments. Activation toggle per agent.

#### Backend
| Service | What it does |
|---------|-------------|
| `gemini_service.py` | Multi-turn conversation manager with Gemini 2.0 Flash. System prompt builder, tool calling (booking, checking, etc.), response streaming |
| `stt_service.py` | Google Cloud STT for Bangla (bn-BD) + English. Streaming recognition for phone calls (8kHz mulaw) |
| `tts_service.py` | Google Cloud TTS for Bangla (bn-BD-Standard-A) + English (en-US-Neural2-F). mulaw for telephony, MP3 for web |
| `voice_enhancements.py` | Sentiment analysis (positive/neutral/negative/urgent), medical intent recognition (8 intents: appointment booking, clinic info, doctor schedule, payment inquiry, prescription refill, test results, emergency, general help), Bangla dialect support (Sylheti, Chittagonian, Rangpuri), Bangla-to-English translation |
| `symptom_matcher.py` | Maps patient symptoms (Bangla/English keywords) to medical specialties and finds matching doctors |

**Speech Recognition:**
| Property | Value |
|----------|-------|
| Bangla model | `latest_short` (optimized for telephony, 8kHz) |
| English model | `latest_short` |
| Encoding | `MULAW` |
| Sample rate | 8000 Hz |
| Language codes | `bn-BD`, `en-US`, `bn-BD,en-US` (fallback) |

**LLM Configuration:**
| Property | Value |
|----------|-------|
| Model | `gemini-2.0-flash-001` |
| Tools | `book_appointment`, `check_availability`, `get_doctor_info`, `get_clinic_info`, `initiate_payment`, `check_payment_status`, `emergency_alert` |
| Max output tokens | 512 |
| Temperature | 0.7 |

**Voice Agent Pipeline:**
```
Incoming Call (Twilio)
    → POST /webhooks/call/incoming/{clinic_id} (TwiML response)
    → WebSocket /webhooks/stream/{clinic_id}
    → Audio Stream (mulaw 8kHz)
    → STT (Google Cloud Speech-to-Text)
    → LLM (Gemini 2.0 Flash + Tool Calling)
    → TTS (Google Cloud Text-to-Speech)
    → Audio Response (mulaw)
    → Twilio Media Stream
```

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Agent Grid | `/agents` | Agent cards with name, status, service count, greeting preview, active/inactive badge, toggle, edit button | `GET /api/agents` |
| Create Agent | Modal | Name, voice selector, tone selector, greeting textarea, system prompt editor, service assignment checkboxes | `POST /api/agents` + `POST /api/agents/{id}/services` |
| Edit Agent | Modal | Same as create, pre-filled with current values, service assignment | `PUT /api/agents/{id}` |
| Toggle Active | Inline | Power/power-off icon button on each card | `PATCH /api/agents/{id}/toggle` |

**Pre-defined agents auto-seeded on first `GET /api/agents` call.**

---

### 9. Services

**Status:** 🟡 **API DONE — No frontend**

**Description:** Configure clinic services — lab tests, pharmacy pricing, telemedicine settings, emergency protocols.

#### Backend

**Lab Services:**
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| List Tests | `GET` | `/api/lab/tests?category=` | Lab test catalog (blood/urine/stool/imaging/cardiology/microbiology/pathology/other) |
| Create Test | `POST` | `/api/lab/tests` | Add test (name, category, specimen type, fee, turnaround, reference ranges) |
| Place Order | `POST` | `/api/lab/orders` | Place lab order (multi-test) |
| List Orders | `GET` | `/api/lab/orders?patient_id=&status=` | View lab orders |
| Get Results | `GET` | `/api/lab/orders/{id}/results` | View test results |
| Add Result | `POST` | `/api/lab/orders/{id}/results` | Enter test results |
| Complete Order | `POST` | `/api/lab/orders/{id}/complete` | Mark order as completed |
| Create Imaging | `POST` | `/api/lab/imaging` | Create imaging study (X-ray, MRI, CT, ultrasound, etc.) |
| List Imaging | `GET` | `/api/lab/imaging` | View imaging studies |

**Models:** `LabTest`, `LabOrder`, `LabResult`, `ImagingStudy`

**Pharmacy Services:**
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Create Order | `POST` | `/api/pharmacy/orders` | Create pharmacy order (auto-generates order number) |
| List Orders | `GET` | `/api/pharmacy/orders?patient_id=&status=` | View pharmacy orders |
| Add Item | `POST` | `/api/pharmacy/orders/{id}/items` | Add medicine to order |
| Dispense | `POST` | `/api/pharmacy/orders/{id}/dispense` | Mark order as dispensed |

**Models:** `PharmacyOrder`, `PharmacyOrderItem`

**Telemedicine:**
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Schedule Session | `POST` | `/api/telemedicine/sessions` | Schedule video consultation |
| List Sessions | `GET` | `/api/telemedicine/sessions?patient_id=&doctor_id=&status=` | View sessions |
| Update Status | `PATCH` | `/api/telemedicine/sessions/{id}/status` | Update session status (scheduled/in-progress/completed/cancelled/no-show) |

**Models:** `TelemedicineSession`

**Emergency:**
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Create Case | `POST` | `/api/emergency/cases` | Create emergency case with triage level |
| List Cases | `GET` | `/api/emergency/cases?status=&triage_level=` | View ER cases |
| Case Detail | `GET` | `/api/emergency/cases/{id}` | Full case detail |
| Update Status | `PATCH` | `/api/emergency/cases/{id}/status` | Update case status |
| Dispatch Ambulance | `POST` | `/api/emergency/ambulance` | Dispatch ambulance |
| List Dispatches | `GET` | `/api/emergency/ambulance?status=` | View ambulance dispatches |

**Models:** `EmergencyCase`, `AmbulanceDispatch`

#### Frontend
**Needed Page:**
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Service Dashboard | `/services` | Overview of all services with status indicators | Medium |

No individual service config pages needed unless expanding beyond what APIs provide.

---

### 10. Knowledge

**Status:** ❌ **NOT STARTED**

**Description:** Medical knowledge base, FAQ management, clinic protocol documents — feeds into AI agent responses for accurate information.

#### Backend
Not built. No models, services, or endpoints exist.

**Proposed Model:** `KnowledgeBase`
| Column | Type |
|--------|------|
| id | UUID PK |
| clinic_id | FK -> clinics (nullable if global) |
| title | String(255) |
| title_bn | String(255) (nullable) |
| content | Text |
| content_bn | Text (nullable) |
| category | String(100) |
| tags | JSON |
| is_public | Boolean (default: false) |
| is_active | Boolean (default: true) |

**Proposed Endpoints:**
| Method | Route | What it does |
|--------|-------|-------------|
| `GET` | `/api/knowledge?category=&q=` | Search knowledge base |
| `POST` | `/api/knowledge` | Create article |
| `GET` | `/api/knowledge/{id}` | Get article |
| `PATCH` | `/api/knowledge/{id}` | Update article |
| `DELETE` | `/api/knowledge/{id}` | Delete article |

#### Frontend
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Knowledge Base | `/knowledge` | Searchable article list with categories. Rich text editor for content. | Low |

---

### 11. Website

**Status:** ❌ **NOT STARTED**

**Description:** Clinic website/public page configuration — hours, doctor profiles, contact info, service listings.

#### Backend
Not built. The existing landing page (`/`) is static.

**Proposed Model:** `ClinicWebsite`
| Column | Type |
|--------|------|
| id | UUID PK |
| clinic_id | FK -> clinics (unique) |
| custom_domain | String(255) (nullable) |
| theme_color | String(7) (default: "#10b981") |
| hero_title | String(255) (nullable) |
| hero_subtitle | Text (nullable) |
| about_text | Text (nullable) |
| is_published | Boolean (default: false) |

#### Frontend
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Website Builder | `/website` | Drag-and-drop or form-based site editor | Low |
| Public Clinic Page | `/clinic/{slug}` | Public-facing landing with hours, doctors, contact, book button | Low |

---

## ACCOUNT

---

### 12. Notifications

**Status:** ✅ **DONE**

**Description:** In-app notification center, configurable SMS/email triggers, notification history.

#### Backend
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| List Notifications | `GET` | `/api/notifications?unread_only=&limit=&offset=` | List notifications for current user |
| Unread Count | `GET` | `/api/notifications/unread-count` | Unread count badge |
| Create Notification | `POST` | `/api/notifications` | Create a notification (admin) |
| Mark as Read | `PATCH` | `/api/notifications/{id}/read` | Mark single notification as read |
| Mark All as Read | `POST` | `/api/notifications/read-all` | Mark all notifications as read |
| Smart Reminder | `POST` | `/api/analytics/v2/appointments/{id}/remind` | Send risk-based reminder SMS |

**Model:** `Notification`: id, clinic_id, user_id, type, title (EN+BN), body (EN+BN), link, is_read, created_at

**Services:**
| Service | What it does |
|---------|-------------|
| `notification_service.py` | CRUD for in-app notifications: create, list (filterable), mark read, mark all read, unread count |
| `sms_service.py` | Sends confirmation, reminder, cancellation SMS via Twilio with SSL Wireless fallback for BD carriers. Message templates in Bangla and English. |

#### Frontend
| Component | Location | Key UI |
|-----------|----------|--------|
| Notification Bell | Dashboard sidebar header | Bell icon with unread count badge (red circle), auto-refreshes every 30s. Dropdown shows 5 most recent notifications with mark-as-read on click. "Open Notification Center" link at bottom. |
| Notification Center | `/notifications` | Full notification list with type filter (pill buttons) and unread/all toggle. Each card shows type badge, title (with Bangla), body, timestamp. Mark as read button per item. Mark all read button. Loading skeleton, error state, empty state. |

---

### 13. Settings

**Status:** ✅ **DONE**

**Description:** Clinic configuration, localization guards, SMS gateway, voice persona, doctor toggles.

#### Backend
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Clinic Profile | `GET` | `/api/clinics/me` | Current clinic info |
| Update Clinic | `PATCH` | `/api/clinics/me` | Update clinic (admin only) |
| List Doctors | `GET` | `/api/clinics/doctors` | Active doctors list |
| Add Doctor | `POST` | `/api/clinics/doctors` | Add doctor (admin) |
| Remove Doctor | `DELETE` | `/api/clinics/doctors/{id}` | Deactivate doctor |

**Models used:** `Clinic`, `Doctor`, `User`

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Settings | `/settings` | Clinic name input, Jumma guard toggle, holiday guard toggle, SMS gateway dropdown + API key, voice persona dropdown, doctor active toggles (3 doctors) | Mock data (no real API calls yet) |

**Missing:** No real API calls to `GET/PATCH /api/clinics/me` or `GET/POST/DELETE /api/clinics/doctors`.

---

## EXTRA MODULES — Backend Ready, No Frontend

---

### 14. EHR / Medical Records

**Status:** ✅ **DONE**

**Description:** Full electronic health records with structured clinical data.

#### Key Endpoints (already listed above in Patients section)
`POST /records`, `GET /records`, `GET /records/{id}`, `GET /patients/{id}/summary`, `POST /records/{id}/vitals`, `POST /records/{id}/diagnoses`, `POST /records/{id}/prescriptions`, `POST /patients/{id}/allergies`, `GET /patients/{id}/allergies`, `POST /patients/{id}/immunizations`, `GET /patients/{id}/immunizations`, `POST /patients/{id}/family-history`

**Models:** `MedicalRecord`, `VitalSign`, `Diagnosis`, `Prescription`, `Allergy`, `Immunization`, `FamilyHistory`

**Frontend:**
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Patient Detail / EHR | `/patients/{id}` | Patient bio header with stats, 8-tab navigation (Summary, Records, Vitals, Diagnoses, Prescriptions, Allergies, Immunizations, Family History). Expandable record cards. Tables for vitals, prescriptions, immunizations. Add buttons for allergies, immunizations, family history. | ✅ Built |

---

### 15. Pharmacy / Dispensary

**Status:** ✅ **DONE**

**Description:** Pharmacy order management — create orders for patients, add items, mark as dispensed.

**Frontend:**
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Pharmacy Dashboard | `/pharmacy` | 4 stat cards (total orders, pending, dispensed, revenue). Search + status filter. Expandable order cards with items table (medicine, dosage, qty, price, dispensed status), Add Item button, Dispense All button, Cancel button. Create Order modal (patient, doctor, delivery address, fee, notes). Add Item modal (medicine name, dosage, quantity, unit price, auto-calculated total). | ✅ Built |

---

### 16. Lab Integration

**Status:** ✅ **DONE**

**Description:** Lab test ordering, result entry, imaging study management.

**Frontend:**
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Lab & Diagnostics | `/lab` | 3-tab layout: Test Catalog (search, category filter, price/turnaround cards), Orders (expandable list with results table, abnormal flagging), Imaging (card grid with status badges). Place Order modal with test selection. | ✅ Built |

---

### 17. Inventory

**Status:** 🟡 **API DONE** — 9 endpoints in `/api/inventory/*`

**Description:** Medicine/supply/equipment inventory with stock tracking and alerts.

**Frontend Needed:**
| Page | Route | Key UI to Build | Priority |
|------|-------|-----------------|----------|
| Inventory Dashboard | `/inventory` | Summary cards: total items, stock value, items by alert level. Category filter. | High |
| Inventory Items | `/inventory/items` | Searchable table: name, category, stock level (color-coded alert), batch, expiry, price | High |
| Add/Edit Item | `/inventory/items/new` | Form: name, category, unit, stock levels, pricing, batch, expiry, manufacturer | High |
| Stock Transaction | `/inventory/stock` | Record purchase/sale/adjustment/return/expired/damaged for an item | High |
| Transaction History | `/inventory/transactions` | Filterable log of all stock movements | Medium |
| Supplies | `/inventory/supplies` | List/manage medical supplies (type: disposable/instrument/ppe/cleaning/other) | Medium |
| Equipment | `/inventory/equipment` | List/manage equipment with maintenance tracking, warranty info | Medium |

---

### 18. Staff Scheduling

**Status:** 🟡 **API DONE** — 7 endpoints in `/api/staff-scheduling/*`

**Description:** Doctor schedule management (covered under Schedule feature above, duplicated here for completeness).

---

### 19. Billing & Invoices

**Status:** ✅ **DONE**

**Description:** Invoice generation, payment tracking, insurance claims, financial reporting.

| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Initiate Payment | `POST` | `/api/payments/initiate` | Start bKash payment |
| Payment Callback | `GET` | `/api/payments/callback` | bKash redirect callback |
| Refund | `POST` | `/api/payments/{appt_id}/refund` | Refund payment |
| Payment Status | `GET` | `/api/payments/{appt_id}/status` | Check payment status |
| Create Invoice | `POST` | `/api/payments/invoices` | Generate invoice |
| List Invoices | `GET` | `/api/payments/invoices?status=` | View invoices |
| Create Insurance Claim | `POST` | `/api/payments/insurance-claims` | Create claim |
| Submit Claim | `POST` | `/api/payments/insurance-claims/{id}/submit` | Submit to insurer |
| List Claims | `GET` | `/api/payments/insurance-claims?status=` | View claims |
| Financial Report | `GET` | `/api/payments/reports/financial?start=&end=` | Revenue report |
| Payment History | `GET` | `/api/payments/history?days=` | Payment history |

**Models:** `Invoice` (DRAFT/SENT/PAID/OVERDUE/CANCELLED), `InsuranceClaim` (DRAFT/SUBMITTED/APPROVED/REJECTED/PAID, providers: PRAGOTI/METLIFE/DELTA/GENERAL/OTHER)

**Frontend:**
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Billing Dashboard | `/billing` | 3-tab layout (Invoices, Payments, Insurance Claims). 5 stat cards (total invoices, paid, overdue, revenue, claims active). Expandable invoice detail with line items breakdown. Payment history table with status badges. Insurance claim cards with submit action. Create Invoice modal with dynamic line items, tax, discount preview. Create Claim modal. | ✅ Built |
| Financial Reports | `/billing/reports` | Date-range report with revenue, fees, insurance breakdown | Low |

---

### 20. Doctor Management

**Status:** ✅ **DONE**

**Description:** Add/edit/deactivate doctors.

| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| List Doctors | `GET` | `/api/clinics/doctors` | Active doctors |
| Add Doctor | `POST` | `/api/clinics/doctors` | Create doctor (admin) |
| Remove Doctor | `DELETE` | `/api/clinics/doctors/{id}` | Deactivate doctor |

**Model:** `Doctor`: name (EN+BN), specialty, qualification, phone, consultation_fee, slot_duration_minutes, available_slots (JSON), symptom_keywords (JSON)

**Frontend:**
| Page | Route | Key UI | Status |
|------|-------|--------|--------|
| Doctor Management | `/doctors` | Card grid with search, active/inactive filter toggle, add/edit modal (name EN+BN, specialty, qualification, phone, fee, slot duration), activate/deactivate toggle | ✅ Built |

---

## AUTHENTICATION

### Auth System

**Status:** ✅ **DONE**

**Description:** Phone OTP-based authentication for clinic staff. Two-step flow: enter phone → receive OTP → verify → JWT issued.

#### Backend
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Request OTP | `POST` | `/api/auth/request-otp` | Send OTP to staff phone |
| Verify OTP | `POST` | `/api/auth/verify-otp` | Verify OTP, return JWT |
| Current User | `GET` | `/api/auth/me` | Return user info from JWT |

**Model:** `User`: phone, name, role (ADMIN/RECEPTIONIST/DOCTOR), otp_hash, otp_expires_at, last_login

**Auth flow:** OTP stored as bcrypt hash with 5-min expiry. JWT issued on verify.

#### Frontend
| Section | Route | Key UI Components | Data Source |
|---------|-------|-------------------|-------------|
| Login | `/login` | Two-step form (phone + OTP), simulated OTP banner, error handling | Mock (no real API) |

**Missing:** Real API integration. Need to connect to `POST /api/auth/request-otp` and `POST /api/auth/verify-otp`. Frontend uses `setTimeout` mock.

---

## TELEPHONY / VOICE

### Voice Agent Pipeline

**Status:** ✅ **DONE**

**Description:** Production-ready voice agent handling inbound patient calls via Twilio, processing through STT → Gemini LLM → TTS pipeline.

#### Backend
| Endpoint | Method | Route | What it does |
|----------|--------|-------|-------------|
| Incoming Call Webhook | `POST` | `/webhooks/call/incoming/{clinic_id}` | Returns TwiML to start Media Stream |
| Audio Stream | `WS` | `/webhooks/stream/{clinic_id}` | WebSocket for real-time audio processing |

**Services involved:** `twilio_service.py`, `stt_service.py`, `gemini_service.py`, `tts_service.py`, `voice_enhancements.py`, `symptom_matcher.py`, `bkash_service.py`, `sms_service.py`

#### Frontend
The dashboard has a live call simulator that mimics the voice agent conversation. No real Twilio integration on frontend (audio streaming happens server-side).

---

## FEATURE SUMMARY TABLE

| # | Feature | Status | Backend APIs | Frontend Pages | Priority for Next |
|---|---------|--------|-------------|----------------|-------------------|
| 1 | Overview Dashboard | ✅ DONE | 2 endpoints | `/dashboard` | Connect to real APIs |
| 2 | Analytics | ✅ DONE | 11 endpoints | `/analytics` | Connect to real APIs |
| 3 | Call Logs | ✅ DONE | 2 endpoints | `/calls` | Connect to real APIs |
| 4 | Appointments | ✅ DONE | 5 + 18 endpoints | `/appointments` | Connect to real APIs |
| 5 | Schedule | ✅ DONE | 7 endpoints | `/schedule` with month calendar, day detail, time-off tab, book/create/time-off modals | **HIGH** |
| 6 | Patients | ✅ DONE | `GET/POST/PUT/DELETE /api/patients` + search | `/patients` with list, register modal, detail slideover | **HIGH** |
| 7 | Settings | ✅ DONE | 5 endpoints | `/settings` | Connect to real APIs |
| 8 | AI Agents | ✅ Done | `/api/agents/*` + 8 pre-defined agents | `/agents` with grid, create, edit, toggle, service assignment | Medium |
| 9 | Services | ✅ Done | `/api/services/*` with 14 categories | `/services` with catalog, CRUD modal, search, category filter | Medium |
| 10 | Notifications | ✅ DONE | 4 endpoints (GET/POST/PATCH) | `/notifications` with full list, type filter, unread filter, mark read, mark all read. Bell dropdown in sidebar header with unread count badge. | Medium |
| 11 | Inventory | ✅ DONE | 9 endpoints | `/inventory` with items table, stock alerts, transactions, supplies, equipment tabs | **HIGH** |
| 12 | Pharmacy | ✅ DONE | 4 endpoints | `/pharmacy` with order list, expandable detail, add items, dispense | **HIGH** |
| 13 | Lab Integration | ✅ DONE | 9 endpoints | `/lab` with test catalog, orders + results, imaging studies | **HIGH** |
| 14 | EHR / Medical Records | ✅ DONE | 12 endpoints | `/patients/{id}` with 8-tab EHR detail page | **HIGH** |
| 15 | Billing & Invoices | ✅ DONE | 11 endpoints | `/billing` with invoices, payment history, insurance claims, financial reports | **HIGH** |
| 16 | Doctor Management | ✅ DONE | 3 endpoints | `/doctors` with card grid, search, active/inactive filter, add/edit modal, toggle | **HIGH** |
| 17 | Emergency / ER | ✅ DONE | 6 endpoints | `/emergency` with cases list, triage badges, detail expand, ambulance dispatch | Medium |
| 18 | Telemedicine | ✅ DONE | 3 endpoints | `/telemedicine` with session list, schedule modal, status actions | Medium |
| 19 | Staff Scheduling | 🟡 API DONE | 7 endpoints | ❌ None | Medium |
| 20 | Support | ❌ Not started | — | ❌ None | Low |
| 21 | Knowledge Base | ❌ Not started | — | ❌ None | Low |
| 22 | Website Builder | ❌ Not started | — | ❌ None | Low |
| 23 | Patient Portal | ❌ Not started | — | ❌ None | Low |
| 24 | Auth / Login | ✅ DONE | 3 endpoints | `/login` | Connect to real APIs |

---

## BUILD ORDER (Recommended)

### Phase 1 — High-Value Frontend Pages (backends already built)
1. **Patients** — ✅ Built: list/search, register modal, detail slideover
2. **Schedule** — ✅ Built: month calendar, day detail, time-off tab, 3 modals
3. **Doctors** — ✅ Built: card grid, search, add/edit modal, active/inactive toggle
4. **EHR / Medical Records** — ✅ Built: `/patients/{id}` with 8-tab detail page
5. **Inventory** — ✅ Built: items table, stock alerts, transactions, supplies, equipment tabs
6. **Lab** — ✅ Built: test catalog, orders + results, imaging studies
7. **Pharmacy** — ✅ Built: order list, create order, add items, dispense workflow
8. **Billing** — ✅ Built: invoice creation, payment history, insurance claims

### Phase 2 — Connect Existing Pages to Real APIs
9. **Dashboard** → `GET /api/analytics/summary`
10. **Analytics** → `GET /api/analytics/*` and `GET /api/analytics/v2/*`
11. **Appointments** → `GET/POST/PATCH/DELETE /api/appointments/*`
12. **Call Logs** → `GET /api/calls`
13. **Settings** → `GET/PATCH /api/clinics/me`, `GET/POST/DELETE /api/clinics/doctors`
14. **Login** → `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`

### Phase 3 — Medium Complexity
15. **Emergency** — ✅ Built: cases list, triage badges, detail expand, ambulance dispatch
16. **Telemedicine** — ✅ Built: session list, schedule modal, status actions
17. **AI Agents** — ✅ Built: config page with grid, toggle, service assignment
18. **Notifications** — ✅ Built: bell dropdown with unread badge + full notification center

### Phase 4 — Advanced / New Builds
19. **Knowledge Base** — Searchable medical FAQ/protocols
20. **Support** — Internal ticketing system
21. **Patient Portal** — Patient self-service
22. **Website Builder** — Clinic public page config
