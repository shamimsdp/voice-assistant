# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. The primary reference documents are `feature-progress.md` and `feature-list.md` in the project root.

When building a feature, follow the **5-step agent workflow** defined in `.opencode/agents/feature-builder.md`:
1. **Research** — Read progress tracker and feature list, examine existing patterns
2. **Backend** — Models → Services → Routers → Tests → Registration
3. **Frontend** — Page → Sidebar link → Styling
4. **Docs** — Update feature-progress.md and feature-list.md
5. **Verify** — Run pytest and npm build

## Scoping Rules

- Work on one feature unit at a time — never implement multiple features in a single session
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step
- If a feature depends on another incomplete feature, finish the dependency first

## When to Split Work

Split an implementation step if it combines:

- Backend changes AND frontend changes for different features
- Multiple unrelated API routes that serve different domains
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly (within 5 minutes), the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files or feature specs
- If a requirement is ambiguous, resolve it by reading the existing codebase to find the established pattern
- If a requirement is missing entirely, ask the user before proceeding
- Prefer following existing patterns over inventing new ones

## Protected Files

Do not modify the following unless explicitly instructed:

- `backend/db/base.py` — Database engine configuration (add new model imports only)
- `backend/models/__init__.py` — Model re-exports (add new model imports only)
- `frontend/node_modules/*` — Third-party dependencies
- `.env` file — Production secrets (use `.env.example` as template)
- `opencode.json` — Project opencode configuration

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `context/architecture.md`
- Code conventions or standards → `context/code-standards.md`
- Feature scope → `feature-list.md`
- Feature progress → `feature-progress.md`
- UI patterns → `context/ui-context.md`

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `context/architecture.md` was violated
3. `feature-progress.md` reflects the completed work
4. `pytest -x -q` passes (for backend changes)
5. `npm run build` passes (for frontend changes)
