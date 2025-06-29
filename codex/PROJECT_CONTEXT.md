🧭 Deployment Context & Import Path Guidance
This project follows a monorepo structure with the following high-level directories:

/
├── api/           # FastAPI backend (main Render service)
├── web/           # Next.js frontend (Vercel-hosted)
├── codex/         # Codex automation logic and task generation
🛠️ Render (Backend) Service

Root Directory: api/
Start Command:
uvicorn src.app.agent_server:app --host 0.0.0.0 --port 10000
Build Command:
bash build.sh
🧩 FastAPI app lives under:

api/src/app/
To ensure proper module resolution (especially on Render), all imports inside api/src/app must be relative or explicitly scoped from the root of the api/src/ package structure. That means:

✅ from ..utils.supabase_client import supabase
✅ from app.routes.agent_run import router
🚫 from src.app.utils.supabase_client import supabase_client
🚫 from utils.supabase_client import supabase_client
We also ensure api/src/__init__.py exists to declare src as a package. This avoids ModuleNotFoundError for app.* modules.

ℹ️ Absolute imports referencing src will fail on Render due to its root directory isolation — Render sets api/ as the working root, not the full repo root.
🖥️ Vercel (Frontend) Service

Root Directory: web/
Framework Preset: Next.js (auto-detected)
Build Command: npm run build
Install Command: npm install
All frontend-related configuration lives in Vercel’s UI and is standard.