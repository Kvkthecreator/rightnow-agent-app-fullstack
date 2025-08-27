# 🧶 yarnnn Monorepo  

yarnnn is a **context-first memory OS** for solo builders and creative professionals. It helps you preserve, defend, and evolve your scattered ideas — turning them into reusable outputs through persistent context.

---

## Architecture  

The project is structured into layers that remain consistent even as implementation details evolve:

| Layer | Concept | Purpose |
|--------|---------|---------|
| 🧺 0 | Baskets | Canonical memory stream (narrative-first workspace) |
| ◾ 1 | Blocks | User-promoted or suggested reusable memory modules |
| 🤖 2 | Agents | Assistive modules that help evolve, defend, and reason over memory |

These layers map to a simple architecture:

- **Frontend**: Next.js on Vercel — narrative rendering, inline promotion actions
- **Backend**: FastAPI on Render + Supabase — memory persistence, agent orchestration
- **Codex**: Developer automation, task scaffolding, and codebase evolution  

> See `codex/AGENTS.md` for durable design principles, including Phase 1 focus and future-ready block economy direction.

---

## Local Development  

Most tasks require only the frontend:

./start-dev.sh
If you need to work on the backend:

cd api
source $(poetry env info --path)/bin/activate
export PYTHONPATH=src
uvicorn app.agent_server:app --reload
Set `NEXT_PUBLIC_API_BASE_URL` in `web/.env.local` to point to your backend instance.
After updating the variable, redeploy the Next.js frontend so runtime route handlers pick up the new value.
You can verify the configuration by requesting /api/baskets/<id>/change-queue; the backend logs should show a GET request and a non-500 response.

The /agent endpoint handles agent requests and remains stable across deployments.

When deploying on Render, ensure the `SUPABASE_SERVICE_ROLE_KEY` environment
variable is set. Without it, Supabase requests will fail.

## Testing

yarnnn uses an **Agent-Operable Test Pipeline** for comprehensive testing:

```bash
# Run all tests (recommended)
npm run agent:test -- --subset=all

# Run specific test subsets
npm run agent:test -- --subset=canon        # Canon compliance tests
npm run agent:test -- --subset=features     # Feature E2E tests  
npm run agent:test -- --subset=unit         # Unit tests
npm run agent:test -- --subset=contracts    # Contract validation
```

The pipeline generates structured reports in `artifacts/` and is designed for agent automation. See `docs/TEST_ARCHITECTURE_AUDIT.md` for complete documentation.

## Repository Layout

api/   FastAPI backend
web/   Next.js frontend
tests/ Agent-operable test suites (canon/features/contracts)
scripts/ Agent test orchestration and seeding
codex/ Codex automation tasks
Quick Summary

Component	Local	Hosted
Frontend	✅	Vercel
Backend	optional	Render
DB/Auth	Hosted only	Supabase
## Developer Notes

### \ud83d\udd27 Data Fetching Architecture

Yarnnn uses a strict separation between server-side and client-side data fetching:

| Folder | Usage | SSR Safe | Auth-safe via Supabase |
|----------------------|--------------------|----------|-------------------------|
| `lib/server/*` | \u2705 Server components | \u2705 Yes | \u2705 Yes (via cookies) |
| `lib/api/*` | \u2705 Client components | \u274c No | \u2705 Yes (browser fetch) |
| `app/api/...` routes | Optional proxy | \u2705 N/A | Use sparingly; mostly deprecated |

\ud83d\udc49 Never use `fetch('/api/…')` inside server components. Always use `lib/server/*` helpers.
