## codex/tasks/refactor-agent-server-and-wire-profile-report-ui.md

✅ Codex Task: refactor-agent-server-and-wire-profile-report-ui.md

## 📄 Task Title
Refactor agent_server output handling and wire frontend Insight Report rendering (Step 4)

## 🎯 Goal
Clean up backend structure to separate legacy agent logic from newer modular agents like ProfileAnalyzer, and complete frontend wiring for the final profile report view.

This will improve clarity while enabling full end-to-end profile flow testing.

---

## 🧠 Prompt to Codex
Refactor backend structure
In agent_server.py, move any outdated shared agent routing or output code (if applicable) into agent_output.py or a new legacy_agent_router.py.
Ensure each endpoint (e.g., /profilebuilder, /profile_analyzer) remains clean and focused:
Use explicit agent imports
Use dedicated helper like send_webhook(...)
Avoid unnecessary shared output formatting unless reused across agents
Leave profile_analyzer_agent.py as a standalone file with a single entry function: profile_analyzer_agent(profile: dict) -> dict
Frontend: Step 4 report rendering
In profile-create.tsx or similar:
On Step 3, when user clicks “Generate Insight Report”, collect the full profile object from Supabase (or local state)
Send a POST /profile_analyzer call with:
{
  "task_id": "...",
  "user_id": "...",
  "profile": {
    "display_name": "...",
    "niche": "...",
    "audience_goal": "...",
    ...
  }
}
While waiting for the response:
Show a loading state ("Generating your insight report...")
When response is received, update local state with the returned message_content, then transition to Step 4
In Step 4 view:
Render:
summary_markdown → use a Markdown renderer (e.g. react-markdown)
strengths, blindspots, next_steps → list under titled sections
Optional: Add a header like “Your Insight Report is ready”

---

## ✳️ Extension: Refactor agent_server and wire frontend Insight Report rendering (Step 4)

### Refactor backend structure

1. In `agent_server.py`, move any outdated shared agent routing or output code (if applicable) into `agent_output.py` or a new `legacy_agent_router.py`.

2. Ensure each endpoint (e.g., `/profilebuilder`, `/profile_analyzer`) remains clean and focused:
   - Use explicit agent imports
   - Use dedicated helper like `send_webhook(...)`
   - Avoid unnecessary shared output formatting unless reused across agents

3. Leave `profile_analyzer_agent.py` as a standalone file with a single entry function: `profile_analyzer_agent(profile: dict) -> dict`

---

### Frontend: Step 4 report rendering

1. In `profile-create.tsx` or similar:
   - On Step 3, when user clicks **“Generate Insight Report”**, collect the full profile object from Supabase (or local state)

2. Send a `POST /profile_analyzer` call with:
   ```json
   {
     "task_id": "...",
     "user_id": "...",
     "profile": {
       "display_name": "...",
       "niche": "...",
       "audience_goal": "...",
       ...
     }
   }
While waiting for the response:
Show a loading state ("Generating your insight report...")
When response is received, update local state with the returned message_content, then transition to Step 4
In Step 4 view:
Render:
summary_markdown → use a Markdown renderer (e.g. react-markdown)
strengths, blindspots, next_steps → list under titled sections
Optional: Add a header like “Your Insight Report is ready”

🧩 Related Files

agent_server.py
agent_output.py or legacy_agent_router.py (new)
profile_analyzer_agent.py
pages/profile-create.tsx
components/ProfileInsightReport.tsx (new if needed)