---
name: feature-docs
description: Updates the project's feature documentation files (feature-progress.md and feature-list.md) after implementing a new feature. Use after completing backend or frontend work to keep status tracking accurate.
---

# Feature Documentation — Shasthya Seba AI

## What to Update

After implementing any feature, update **both** of these files:

### 1. `feature-progress.md`

Located at project root. This is the high-level progress tracker.

**Sections to update:**
- **Current Phase** — Update if moving to a new phase
- **Current Goal** — Set to what you just built (or next goal)
- **Completed** — Add the feature with a brief description of what was built
- **In Progress** — Remove completed items, add any ongoing work
- **Next Up** — Remove completed items
- **Open Questions** — Add any new questions that arose during implementation
- **Architecture Decisions** — Add any decisions made during implementation
- **Session Notes** — Add a dated entry for this session

**Status legend to use:**
- ✅ **DONE** — Backend + Frontend both complete
- 🟡 **API DONE** — Backend API exists, no frontend page yet
- 🟠 **PARTIAL** — Partial implementation
- ❌ **NOT STARTED** — Not built anywhere

### 2. `feature-list.md`

Located at project root. This is the comprehensive feature specification.

**Sections to update:**
- Find the feature's section by its category (CLINICAL, SETUP, ACCOUNT, EXTRA)
- Update the **Status** column to ✅ for completed items
- Fill in any missing details about what was implemented
- Add new endpoints, models, or frontend pages that were created
- Update "Missing" notes to reflect what was completed

**For each feature, update:**
- The status emoji in the category table
- The Backend table (add new endpoints with method, route, description)
- The Frontend table (add new pages with route, components, data source)
- The "Missing" section (remove items that were completed)

## Feature Status Quick Reference

| Status | Meaning |
|--------|---------|
| ✅ DONE | Backend API + Frontend page + Tests all complete |
| 🟡 API DONE | Backend API and tests exist, no frontend |
| 🟠 PARTIAL | Some parts built but not complete |
| ❌ NOT STARTED | Nothing built yet |

## After Updating

Run verification:
- `cd backend && pytest -x -q` (if backend was changed)
- `cd frontend && npm run build` (if frontend was changed)
