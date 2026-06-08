# Code Standards

## General

- Keep modules small and single-purpose — one model file per domain, one service file per domain
- Fix root causes, do not layer workarounds — prefer refactoring over patching
- Do not mix unrelated concerns in one component, route, or service function
- All code must be bilingual-ready: add `_bn` suffix fields for Bangla alongside English

## Backend (Python)

- Use `async def` for all endpoints and service functions — SQLAlchemy 2.0 async session
- Use `enum.StrEnum` for enum types — never plain strings for constrained values
- Every model gets: UUID PK, `clinic_id` FK (indexed), `created_at`, `updated_at`
- Pydantic models for all request/response bodies in routers — never raw dicts
- Service functions are pure: take `(clinic_id, db, ...)` params, return data, raise `ValueError`
- Use `structlog` for logging — not `print()` or `logging`
- Handle dates with `datetime.date` — parse from ISO strings in routers
- Use `Optional[...]` type hints for nullable fields — never bare `= None`

## Frontend (TypeScript + Next.js)

- Strict mode is required throughout the project — `tsconfig.json` has `"strict": true`
- Avoid `any` — use explicit interfaces or Zod schemas for type safety
- Validate unknown external input at system boundaries — Zod schemas in forms, API response types
- All pages default to `"use client"` — we use framer-motion and React hooks everywhere
- Use `@/` path alias for imports — e.g. `@/lib/utils`, `@/lib/providers`

## Styling

- Use Tailwind CSS utility classes only — no inline styles, no CSS modules
- Dark theme tokens: `bg-[#070b13]` (page), `bg-[#0a1120]` (surface), `border-slate-800` (default border)
- Accent color: `emerald-500` for primary actions, `emerald-400` for hover states
- Badge/variant classes: `bg-{color}-500/10` background, `text-{color}-400` text, `border-{color}-500/25` border
- Button pattern: `px-4 py-2.5 rounded-xl text-sm font-semibold`
- Card pattern: `bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6`
- Input pattern: `px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800`

## API Routes

- Validate and parse request input with Pydantic before any logic runs
- Enforce auth (`Depends(get_current_user)`) and clinic scoping before any mutation
- Return consistent shapes: `{"id": ..., "name": ..., ...}` for creates, list of objects for GETs
- Use proper HTTP status codes: 201 for creates, 204 for deletes, 400 for validation, 404 for not found
- Every endpoint logs its action with `logger.info(...)`

## Data and Storage

- Metadata belongs in PostgreSQL — structured fields with proper types
- JSON columns for flexible/optional data (symptoms, working hours, transcript, line items)
- Do not store large binary content in the database — use file storage (future: cloud storage)
- All timestamps in UTC — `datetime.utcnow()` in models

## File Organization

- `backend/models/` — One file per domain module (e.g., `clinic_operations.py`, `ehr.py`)
- `backend/services/` — One service file per domain, named `{domain}_service.py`
- `backend/routers/` — One router file per domain (e.g., `inventory.py`, `pharmacy.py`)
- `backend/tests/` — Test files mirroring the module name under test
- `frontend/app/` — Next.js App Router pages grouped by route segments
- `frontend/lib/` — Shared utilities: `store.ts` (zustand), `providers.tsx` (TanStack Query), `utils.ts` (cn)
- `context/` — Project context files for AI-assisted development

## Testing

- One test file per domain module in `backend/tests/`
- Test model properties/computed fields with plain unit tests
- Test service logic with `AsyncMock` for db sessions
- Test router endpoints via `TestClient` (FastAPI test client)
- Use in-memory SQLite (`sqlite+aiosqlite:///:memory:`) for integration tests
- Run with: `cd backend && pytest -x -q`
