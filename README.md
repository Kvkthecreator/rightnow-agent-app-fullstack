# ✅ FILE: README.md (top-level - append to existing or replace dev section)
## 🛠 Development Setup

This repo is configured to:
- Use the **hosted backend** on Render (always-on)
- Use **Supabase (hosted)** for DB/Auth
- Run only the **frontend locally** during most development

### ✅ To Start Local Frontend Only
```bash
cd ~/rightnow-agent-app-fullstack/web
npm install  # first time only
npm run dev
```

Make sure your `/web/.env.local` is set:
```
NEXT_PUBLIC_API_URL=https://rightnow-agent-app-fullstack.onrender.com
```

### 🧪 To Run Backend (only if modifying Python code)
```bash
cd ~/rightnow-agent-app-fullstack/api
source $(poetry env info --path)/bin/activate
export PYTHONPATH=src
uvicorn app.agent_server:app --reload
```

### 🤖 To Use Codex CLI
```bash
codex
> Explain this error
> Help me refactor this route
```
See [codex_workflow_guide.md](./codex/codex_workflow_guide.md) for the full Codex workflow playbook.

## 🛠 Development Setup

This app uses a hosted architecture for backend and database, simplifying local development.

### ✅ Local + Hosted Setup
| Component     | Run Locally? | Hosted?                              |
|---------------|--------------|---------------------------------------|
| Frontend (Next.js) | ✅ Yes       | Vercel                              |
| Backend (FastAPI)  | ❌ Default  | [Render](https://rightnow-agent-app-fullstack.onrender.com) |
| Database (Supabase) | ❌         | Supabase                            |

---

### ▶️ Start Development

```bash
./start-dev.sh