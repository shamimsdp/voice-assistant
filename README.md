# 🇧🇩 Shasthya Seba AI — Bangladesh Medical Voice Assistant

An AI-powered medical receptionist and clinic scheduling system for Bangladesh. Supports multilingual voice dialogues (Bangla/Banglish/English), appointment bookings, bKash payments, SMS confirmations, and a clinic staff dashboard.

---

## ✨ Features

| # | Feature | Status |
|---|---------|--------|
| 1 | **Multilingual Voice** — STT/TTS in bn-BD via Google Cloud, dialect detection, sentiment analysis | ✅ Done |
| 2 | **Appointment Booking** — Conflict detection, group booking, recurring appointments, waiting list, symptom→specialty matching, duration estimation | ✅ Done |
| 3 | **bKash Payments** — Tokenized Checkout API, invoice generation, insurance claims, financial reports, refunds | ✅ Done |
| 4 | **Clinic Analytics** — No-show prediction, KPI dashboard, demographics, trends, predictive staffing, outbreak detection, NPS scoring | ✅ Done |
| 5 | **Jumma Prayer Guard** — Automatically blocks Fri 12:00–14:00 | ✅ Done |
| 6 | **SMS Gateway** — Twilio SMS + SSL Wireless fallback | ✅ Done |

---

## 🏗️ Architecture

```
Patient Call (Phone / WhatsApp)
        │
        ▼
  Twilio / WhatsApp Business API
        │  (Audio Stream)
        ▼
  FastAPI WebSocket Server  ◄──── Redis (Session State)
        │
        ├─── Google Cloud STT [bn-BD] ──► Transcript
        │
        ├─── Gemini 2.0 Flash (LLM Brain)
        │       ├── book_appointment()
        │       ├── check_schedule()
        │       ├── send_confirmation_sms()
        │       └── initiate_bkash_payment()
        │
        └─── Google Cloud TTS [bn-BD Neural2] ──► Audio
                                │
                          PostgreSQL
                                │
                          Next.js Dashboard
```

---

## 📁 Project Structure

```
voice-assistant/
├── backend/
│   ├── main.py                 # FastAPI entrypoint
│   ├── config.py               # Pydantic settings (.env)
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   ├── db/                     # Session & engine setup
│   ├── models/                 # SQLAlchemy models
│   │   ├── appointment.py      # Appointments, payment status
│   │   ├── clinic.py           # Clinics
│   │   ├── patient.py          # Patients
│   │   ├── doctor.py           # Doctors, consultation fees
│   │   ├── call_log.py         # Call logs
│   │   ├── user.py             # Staff users, OTP auth
│   │   ├── advanced_appointments.py  # Waiting list, recurring, group booking
│   │   └── payment.py          # Invoices, insurance claims
│   ├── routers/
│   │   ├── calls.py            # Twilio voice call webhooks
│   │   ├── appointments.py     # CRUD appointments
│   │   ├── advanced_appointments.py  # Wait list, recurring, group, symptoms
│   │   ├── analytics.py        # KPI dashboard, no-show, demographics
│   │   ├── analytics_v2.py     # Enhanced analytics endpoints
│   │   ├── payments.py         # bKash, invoices, insurance, reports
│   │   ├── auth.py             # OTP-based login
│   │   ├── clinics.py          # Clinic management
│   │   └── webhooks.py         # External webhooks
│   ├── services/               # Business logic & integrations
│   │   ├── analytics_service.py
│   │   ├── advanced_appointments.py
│   │   ├── symptom_matcher.py
│   │   ├── payment_service.py
│   │   ├── bkash_service.py
│   │   ├── sms_service.py
│   │   └── ...
│   ├── voice/                  # Gemini agent & prompts
│   ├── utils/                  # BD holidays, prayer times
│   └── tests/                  # 85+ pytest tests
│       ├── test_voice_enhancements.py
│       ├── test_advanced_appointments.py
│       ├── test_analytics.py
│       ├── test_payments.py
│       └── test_services.py
├── frontend/
│   ├── app/                    # Next.js pages (Dashboard, Appointments, Logs)
│   ├── package.json            # Next.js 16 + React 19
│   └── Dockerfile
├── docker-compose.yml          # PostgreSQL + Redis + Backend + Frontend
├── Makefile                    # Dev shortcuts
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose | Required |
|------|---------|---------|----------|
| Python | ≥ 3.12, ≤ 3.13 | Backend | ✅ Yes |
| Node.js | ≥ 22 | Frontend | ✅ Yes |
| PostgreSQL | ≥ 16 | Database | ✅ Yes (or via Docker) |
| Docker | ≥ 24 | PostgreSQL & Redis (optional) | ⬜ If no local DB |
| Redis | ≥ 7 | Session cache | ⬜ Only for voice calls |
| ngrok | — | Twilio webhook tunnel | ⬜ Only for Twilio |

### 1. Clone & Install

```bash
git clone <repo-url> && cd voice-assistant

# --- Backend ---
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate
cd backend && pip install -r requirements.txt

# --- Frontend ---
cd ../frontend && npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your API keys (see `.env.example` for all fields). Defaults work for local development with PostgreSQL:
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/voice_assistant
```

Create the database (if it doesn't exist):
```bash
# On Windows (with PostgreSQL in PATH):
createdb -U postgres voice_assistant
# Or via psql:
psql -U postgres -c "CREATE DATABASE voice_assistant"
```

Minimum required for full functionality:
- `GEMINI_API_KEY` — Google Gemini 2.0 Flash key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — Twilio credentials

### 3. Start the Backend

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The first startup auto-creates all database tables (12 tables + 8 enum types).

### 4. Start the Frontend (in a separate terminal)

```bash
cd frontend
npm run dev
```

### 5. Access the Application

| Service | URL |
|---------|-----|
| **Next.js Dashboard** | [http://localhost:3000](http://localhost:3000) |
| **FastAPI API** | [http://localhost:8000](http://localhost:8000) |
| **Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ReDoc Docs** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |

### Quick Start (all commands)

```bash
# ---- Terminal 1 ----
# Ensure PostgreSQL is running, then:
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# ---- Terminal 2 ----
cd frontend
npm run dev
```

### Using Docker (alternative to local PostgreSQL)

If you don't have PostgreSQL locally:
```bash
# Start PostgreSQL & Redis via Docker
docker compose up -d postgres redis

# Then start backend and frontend as above
```

### Makefile Shortcuts

```bash
make install     # Install all dependencies
make dev         # Docker + backend + frontend (all-in-one)
make backend     # Start only the backend
make frontend    # Start only the frontend
make test        # Run all backend tests
make lint        # Lint all code
make tunnel      # ngrok tunnel for Twilio webhooks
```

### 4. URLs

| Service | URL |
|---------|-----|
| Next.js Dashboard | http://localhost:3000 |
| FastAPI API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

### 5. Run Tests

```bash
cd backend && python -m pytest -v --tb=short
```

The test suite validates:
- Sentiment analysis (Bangla/English/urgent)
- Intent recognition (book, cancel, reschedule, emergency)
- Dialect detection (standard Bangla)
- Appointment conflict detection & duration estimation
- Symptom→specialty matching (Bangla + English)
- Waiting list & recurring appointments
- No-show prediction & KPI computation
- Invoice generation & financial reports
- Insurance claim processing
- bKash payment initiation & refund
- Bangladesh public holidays
- Jumma Friday prayer time guard

---

## 🧪 Test Suite

```
tests/
├── test_voice_enhancements.py     # 35 tests — sentiment, intent, dialect, context
├── test_advanced_appointments.py   # 23 tests — conflicts, symptoms, waiting list
├── test_analytics.py               #  9 tests — no-show, KPIs, demographics, outbreaks
├── test_payments.py                # 14 tests — invoices, insurance, refunds, history
├── test_services.py                #  4 tests — holidays, Jumma, bKash
                                   ───────────────────
                                   85 tests total (all passing)
```

---

## 📡 API Endpoints

### Voice & Calls
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/calls/incoming` | Twilio inbound voice webhook |
| `POST` | `/api/calls/transcribe` | Real-time STT transcription |
| `GET` | `/api/calls/{id}` | Call log details |

### Appointments
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/appointments` | List appointments |
| `POST` | `/api/appointments` | Create appointment |
| `GET` | `/api/appointments/{id}` | Appointment details |
| `PUT` | `/api/appointments/{id}` | Update appointment |
| `DELETE` | `/api/appointments/{id}` | Cancel appointment |

### Advanced Appointments
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/advanced-appointments/conflicts` | Detect time conflicts |
| `POST` | `/api/advanced-appointments/estimate-duration` | Predict appointment length |
| `POST` | `/api/advanced-appointments/waiting-list` | Add to wait list |
| `POST` | `/api/advanced-appointments/recurring` | Create recurring template |
| `POST` | `/api/advanced-appointments/match-symptoms` | Symptom→specialty mapping |
| `POST` | `/api/advanced-appointments/group-bookings` | Group booking |
| `POST` | `/api/advanced-appointments/questionnaires` | Create questionnaire |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/payments/initiate` | Start bKash payment |
| `GET` | `/api/payments/callback` | bKash redirect callback |
| `POST` | `/api/payments/{id}/refund` | Refund payment |
| `GET` | `/api/payments/{id}/status` | Payment status |
| `POST` | `/api/payments/invoices` | Generate invoice |
| `GET` | `/api/payments/invoices` | List invoices |
| `POST` | `/api/payments/insurance-claims` | Create insurance claim |
| `GET` | `/api/payments/insurance-claims` | List claims |
| `GET` | `/api/payments/reports/financial` | Financial report |
| `GET` | `/api/payments/history` | Payment history |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/kpi` | KPI dashboard |
| `GET` | `/api/analytics/demographics` | Patient demographics |
| `GET` | `/api/analytics/trends` | Monthly trends |
| `GET` | `/api/analytics/predictive-staffing` | Staffing recommendations |
| `GET` | `/api/analytics/outbreak-trends` | Outbreak symptom detection |
| `GET` | `/api/analytics/appointments/{id}/no-show-risk` | No-show prediction |
| `POST` | `/api/analytics/appointments/{id}/remind` | Smart reminder |
| `POST` | `/api/analytics/appointments/{id}/satisfaction` | NPS score |
| `GET` | `/api/analytics/no-show-summary` | High-risk appointments |

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/send-otp` | Request OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP + get JWT |

---

## 🛡️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.13, FastAPI 0.111, Uvicorn |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 |
| **Database** | PostgreSQL 16 (via SQLAlchemy 2.0 async) |
| **Cache** | Redis 7 |
| **LLM** | Google Gemini 2.0 Flash |
| **STT/TTS** | Google Cloud Speech-to-Text / Text-to-Speech (bn-BD) |
| **Payments** | bKash Tokenized Checkout API |
| **SMS** | Twilio + SSL Wireless |
| **Auth** | OTP-based + JWT |
| **Testing** | Pytest 8.2 (85 tests) |
| **Linting** | Ruff |

---

## 🗺️ Roadmap

- [x] Voice pipeline (STT → Gemini → TTS)
- [x] Appointment management (CRUD, advanced)
- [x] bKash payments, invoicing, insurance
- [x] Analytics & no-show prediction
- [ ] **Clinic Operations** — Inventory, staff scheduling, lab integration, bed management
- [ ] **Integration & Expansion** — Telemedicine, EHR, multi-clinic support
- [ ] Real-time dashboard with WebSockets
- [ ] Mobile app (React Native)

---

## 📄 License
Built for premium clinic reception workflows. For commercial inquiries, consult the system administrator.
