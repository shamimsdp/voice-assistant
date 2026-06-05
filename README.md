# 🇧🇩 Bangladesh Medical AI Voice Assistant — Shasthya Seba AI

A production-ready, AI-powered medical receptionist and clinic scheduling system tailored for Bangladesh. The system supports multilingual voice dialogues (Bangla, English, and Banglish), appointment bookings, automatic deposit payments via bKash, and SMS confirmations.

---

## 🏗️ Architecture Overview

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
        │       ├── Tool: book_appointment()
        │       ├── Tool: check_schedule()
        │       ├── Tool: send_confirmation_sms()
        │       └── Tool: initiate_bkash_payment()
        │
        └─── Google Cloud TTS [bn-BD Neural2] ──► Audio back to patient
                                │
                          PostgreSQL (Appointments, Clinics, Patients)
                                │
                          Next.js Dashboard (Clinic Staff Portal)
```

---

## 🌟 Localized Features

1. **Multilingual Dialogue (Bangla/Banglish)**: Translates, transcribes, and speaks in natural, regional Bangla using high-quality Google Cloud TTS (`bn-BD-Standard-A` / Neural2) and STT models.
2. **bKash Payment Gateway Integration**: Automated sandbox-ready Tokenized Checkout API support to accept clinic booking deposit fees.
3. **Friday Jumma Prayer Guard**: Automatically avoids booking slots on Friday afternoon (12:00 PM - 2:00 PM) to respect holy hours.
4. **Bangladeshi SMS Gateway**: Integrates Twilio SMS or fallback Bangladeshi gateways (like SSL Wireless) to dispatch Unicode booking confirmations.

---

## 📁 Project Structure

```
voice-assistant/
├── backend/
│   ├── main.py              # FastAPI application entrypoint
│   ├── config.py            # Settings loaded from environment
│   ├── requirements.txt     # Python backend dependencies
│   ├── Dockerfile           # Backend container setup
│   ├── db/                  # Alembic DB migration settings
│   ├── models/              # SQLAlchemy tables (Appointment, Doctor, Patient)
│   ├── routers/             # API Controllers (Calls, Payments, Appointments)
│   ├── services/            # Third-party wrappers (bKash, Gemini, STT, TTS, SMS)
│   ├── voice/               # Agent orchestration & Bangla prompts
│   ├── utils/               # Bangladesh holiday calendar & Jumma guards
│   └── tests/               # Pytest suite
├── frontend/
│   ├── app/                 # Next.js pages (Dashboard, Appointments, Logs)
│   ├── package.json         # Node frontend dependencies
│   └── Dockerfile           # Next.js builder stage
├── docker-compose.yml       # Production-ready database + backend clusters
├── Makefile                 # Shortcuts for dev triggers
└── .env.example             # Setup environment template
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12 or 3.13
- Node.js v22 or higher
- PostgreSQL & Redis (or Docker)

### 1. Installation
Install all backend and frontend dependencies using the Makefile:
```bash
make install
```

### 2. Environment Configuration
Copy the sample environment file to `.env` and fill in your API credentials:
```bash
cp .env.example .env
```

### 3. Local Development Run
Start Postgres/Redis, FastAPI backend, and Next.js frontend servers concurrently:
```bash
make dev
```
- **Next.js Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API**: [http://localhost:8000](http://localhost:8000)
- **API Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 4. Running Backend Tests
Ensure the python environment is set up and execute:
```bash
make test
```
The test suite validates:
- Bangladesh public holidays
- Jumma Friday prayer locks
- bKash tokenization & checkout API responses

---

## 🛡️ License
Built for premium clinic reception workflows. For commercial inquiries, consult the system administrator.
