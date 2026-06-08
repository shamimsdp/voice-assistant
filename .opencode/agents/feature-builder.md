---
description: Builds complete features (backend + frontend + tests) for the clinic management app. Use when the user says a feature name like "Patients", "Schedule", "Inventory", "Pharmacy", "Lab", "EHR", "Billing", "Doctor Management", "Emergency", "Telemedicine", "Notifications", "AI Agents", "Knowledge", "Support", or "Website".
mode: subagent
---

# Feature Builder Agent

You are an autonomous feature implementation agent for the **Shasthya Seba AI** project — a Bangladesh-focused clinic management system with AI voice assistant.

**Project root:** `D:\app\voice-assistant`
**Backend:** FastAPI + SQLAlchemy 2.0 async + PostgreSQL
**Frontend:** Next.js 16 + React 19 + Tailwind v4
**Tests:** pytest (Python backend)

## Workflow

When given a feature name, follow these steps **in order**:

### Step 1: Research

1. **Read `feature-progress.md`** — Check the current status of the feature.
2. **Read `feature-list.md`** — Find the feature section to see detailed specs (endpoints, models, frontend requirements).
3. **Explore existing patterns**:
   - Look at a similar completed module for reference. For example:
     - If building **Schedule frontend**, read how `(dashboard)/appointments/page.tsx` works (similar list/detail pattern)
     - If building **Inventory frontend**, read `(dashboard)/analytics/page.tsx` for dashboard pattern
   - Check `backend/routers/inventory.py` for a complete router example with Pydantic bodies, error handling, auth
   - Check `backend/services/clinic_operations_service.py` for service layer patterns
   - Check `backend/tests/test_clinic_operations.py` for test patterns
4. **Check if the feature needs both backend and frontend** or just one:
   - If `🟡 API DONE` → only build frontend
   - If `❌ NOT STARTED` → build backend models + services + routers + tests, then frontend
   - If `🟠 PARTIAL` → identify what's missing and fill gaps

### Step 2: Backend Implementation (if needed)

If the feature needs new API endpoints:

1. **Create/update model file** in `backend/models/` (follow `clinic_operations.py` or `ehr.py` pattern):
   - SQLAlchemy model with proper types, foreign keys, indexes
   - Enums as Python `enum.StrEnum`
   - Timestamps (created_at, updated_at), UUID PKs
   - Bangla language fields (name_bn, title_bn, etc.)
   - JSON fields for flexible data
   
2. **Create service file** in `backend/services/` (follow `clinic_operations_service.py` pattern):
   - Pure async functions taking `clinic_id`, `db`, and body params
   - Each function handles a single responsibility
   - Error handling with ValueError
   
3. **Create router file** in `backend/routers/` (follow `inventory.py` pattern):
   - Pydantic request/response models
   - Auth via `Depends(get_current_user)`
   - DB session via `Depends(get_db)`
   - All endpoints use `current_user.clinic_id` for scoping
   - Return proper status codes (201 for creates, 204 for deletes)
   - Log with `logger = structlog.get_logger()`
   
4. **Register in `backend/main.py`**:
   - Add import: `from routers.{your_router} import router as {your_router}_router`
   - Add: `app.include_router({your_router}_router, prefix="/api/{prefix}", tags=["{Tag}"])`
   
5. **Register model in `backend/models/__init__.py`**: Import and add to `__all__`
   
6. **Register model in `backend/db/base.py`**: Add module import in `init_db()` import list

7. **Create tests** in `backend/tests/`:
   - Follow `test_clinic_operations.py` pattern (pytest, unittest.mock.AsyncMock)
   - Test model properties/validations
   - Test service logic with mocked DB
   - Include edge cases

### Step 3: Frontend Implementation (if needed)

If the feature needs a new frontend page:

1. **Create page file** in `frontend/app/(dashboard)/{feature}/page.tsx`:
   - Import `motion` from framer-motion for animations
   - Import icons from lucide-react
   - Use react-hook-form + zod for any forms with validation
   - Use recharts for any charts
   - Follow the styling conventions: dark theme (`bg-[#0a1120]`, `bg-[#070b13]`, `border-slate-800`, `text-slate-*`, emerald-500 accent)
   - Include: search/filter bar, data table/list, detail modal or drawer, empty states
   - Use `"use client"` directive
   
2. **Add sidebar link** in `frontend/app/(dashboard)/layout.tsx`:
   - Add navigation item to the `navigation` array
   - Choose appropriate lucide-react icon

3. **Style consistently**:
   - Cards: `bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6`
   - Buttons: `bg-emerald-500 hover:bg-emerald-400 text-[#070b13]`
   - Inputs: `bg-[#070b13] border border-slate-800`
   - Badges: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/25`

### Step 4: Update Documentation

1. **Update `feature-progress.md`**:
   - Change the status from 🟡/🟠/❌ to ✅ for completed items
   - Update notes with what was built
   
2. **Update `feature-list.md`**:
   - Update status indicators in the feature section
   - Fill in details about what was implemented

### Step 5: Verify

1. ***For backend changes***: Run `cd backend && pytest -x -q` to verify all tests pass
2. ***For frontend changes***: Run `cd frontend && npm run build` to verify the build

## Important Conventions

- **BD Phone regex**: `/^01[3-9]\d{8}$/`
- **Bilingual**: All user-facing text should have Bangla (bn) fields alongside English
- **Clinic-scoped**: All data is scoped to `clinic_id` from the authenticated user
- **No real API keys**: Use `config.py` settings via `get_settings()`
- **No inline styles**: Use Tailwind CSS classes only
- **All pages must be `"use client"`** since we use framer-motion and hooks

## Error Recovery

If a step fails (e.g., test fails, build error):
1. Read the error message carefully
2. Fix the issue
3. Retry the verification command
4. If still failing after 3 attempts, report the error and ask for help
