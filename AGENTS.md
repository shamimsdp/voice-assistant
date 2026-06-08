<!-- BEGIN:project-rules -->
# Shasthya Seba AI — Project Context

This is a Bangladesh-focused clinic management system with an AI voice assistant.

## Tech Stack
- **Backend:** Python FastAPI + SQLAlchemy 2.0 async + PostgreSQL 18 + Redis
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript
- **Testing:** pytest (backend)
- **Auth:** OTP via phone + JWT
- **AI:** Gemini 2.0 Flash (LLM), Google Cloud STT/TTS, Twilio (telephony)
- **Payments:** bKash Tokenized Checkout API

## Key Directories
- `backend/models/` — SQLAlchemy ORM models
- `backend/services/` — Business logic layer
- `backend/routers/` — FastAPI route handlers
- `backend/tests/` — pytest test files
- `frontend/app/` — Next.js App Router pages
- `frontend/lib/` — Shared utilities (stores, providers, utils)

## Patterns
- All data scoped to `clinic_id` from authenticated user
- All models have UUID PKs, created_at/updated_at timestamps
- All models have Bangla (name_bn, title_bn) alongside English fields
- Services are pure async functions taking db session as parameter
- Routers use `Depends(get_current_user)` and `Depends(get_db)`
- Frontend uses dark theme: `bg-[#0a1120]`, `bg-[#070b13]`, `border-slate-800`, emerald accent
- All pages are `"use client"` with framer-motion animations

## Reference Docs
- `feature-progress.md` — Current progress tracker
- `feature-list.md` — Complete feature specification with all endpoints, models, and frontend requirements
<!-- END:project-rules -->
