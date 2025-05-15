## codex/tasks/debug_agentrouting.md

❌ 404 Error: POST https://rightnow-agent-app-fullstack.onrender.com/agent

🔎 Cause:
Render shows the service is running, but the /agent route is returning 404.

This usually means:

The FastAPI router isn’t registering the /agent endpoint, or
The agent_server.py file isn’t being correctly wired in as app
✅ Steps to Fix

✅ Step 1: Confirm your FastAPI app definition
In your agent_server.py, make sure you have:

from fastapi import FastAPI
from app.agent_entrypoints import agent_router

app = FastAPI()

# Mount agent routes
app.include_router(agent_router, prefix="/agent")
So /agent should be your actual route root.

✅ Step 2: Check Render start command
Make sure your Render web service is using:

uvicorn app.agent_server:app --host 0.0.0.0 --port 10000
This looks correct from your log, so you’re likely fine here.

✅ Step 3: Confirm the route file itself
In agent_entrypoints.py, you should have:

from fastapi import APIRouter
from agents.runner import run_agent

agent_router = APIRouter()

@agent_router.post("")
async def run_agent_route(request: AgentRunRequest):
    return await run_agent(request)
Make sure:

agent_router is correctly defined and used
There's a @agent_router.post("") → not @agent_router.post("/agent") (you only want the base /agent once)
✅ Step 4: Try hitting this POST again:
POST https://rightnow-agent-app-fullstack.onrender.com/agent
If still 404, test with a different route like:

GET https://rightnow-agent-app-fullstack.onrender.com/docs
That should show your OpenAPI docs and confirm what routes are available.

🔧 If Still Broken

Paste back the contents of:

agent_server.py
agent_entrypoints.py
And I’ll patch it instantly. You're super close — it’s just a routing wire issue.