# 🧶 yarnnn Monorepo

yarnnn is a context-first OS for solo builders and creative professionals. It organizes scattered ideas into reusable outputs through persistent context.

## Architecture

The project is structured into layers that remain consistent even as implementation details evolve:

| Layer | Concept | Purpose |
|-------|---------|---------|
| 🧺 0 | Baskets | Workspace for context and goals |
| ◾ 1 | Blocks  | Reusable building blocks |
| 🤖 2 | Agents  | Modules that act on baskets and blocks |

These layers map to a simple architecture:

- **Frontend**: Next.js on Vercel
- **Backend**: FastAPI on Render with Supabase
- **Codex**: Developer automation and task scaffolding

## Local Development

Most tasks require only the frontend:

```bash
./start-dev.sh
```

If you need to work on the backend:

```bash
cd api
source $(poetry env info --path)/bin/activate
export PYTHONPATH=src
uvicorn app.agent_server:app --reload
```

Set `NEXT_PUBLIC_API_BASE` in `web/.env.local` to point to your backend instance.

The `/agent` endpoint handles agent requests and is stable across deployments.

## Repository Layout

```
api/   FastAPI backend
web/   Next.js frontend
codex/ Codex automation tasks
```

See `codex/AGENTS.md` for stable architecture details.

## Quick Summary

| Component | Local | Hosted |
|-----------|-------|-------|
| Frontend | ✅ | Vercel |
| Backend  | optional | Render |
| DB/Auth  | Hosted only | Supabase |
