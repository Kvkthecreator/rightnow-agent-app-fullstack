## codex/tasks/2_task-1-report-api-routes.md

# Task 1 — Extend API routes for reports

## Context
* `/agent-run` now creates a Report row first.
* New route `GET /reports/{report_id}` returns output_json (auth-gated).

## Changes
```diff
* api/src/app/agent_server.py
+ api/src/app/routes/reports.py

*** 🔧 Patch agent_server.py (excerpt) ***
-from fastapi import APIRouter, HTTPException
+from fastapi import APIRouter, HTTPException, Depends
+from app.db.reports import create_report, complete_report
+from app.util.auth_helpers import current_user_id  # (assumes you have this)

 @router.post("/agent-run")
 async def run_agent(payload: dict, user_id: str = Depends(current_user_id)):
-    task_type_id = payload.pop("task_type_id")
+    task_type_id = payload.pop("task_type_id")
+    report_id = create_report(user_id, task_type_id, payload)
     try:
         result = await route_and_validate_task(task_type_id, payload)
+        complete_report(report_id, result)
     except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
-    return result
+    return {"report_id": report_id}

*** ✨ routes/reports.py ***
from fastapi import APIRouter, HTTPException, Depends
from app.db.reports import get_report
from app.util.auth_helpers import current_user_id

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/{report_id}")
async def read_report(report_id: str, user_id: str = Depends(current_user_id)):
    data = get_report(report_id, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
    return data

*** 🔧 Mount router (in api/src/app/__init__.py or wherever) ***
- app.include_router(task_types.router)
+ app.include_router(task_types.router)
+ app.include_router(reports.router)
