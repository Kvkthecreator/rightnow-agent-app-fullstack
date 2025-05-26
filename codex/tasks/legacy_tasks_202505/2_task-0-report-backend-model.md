## codex/tasks/2_task-0-report-backend-model.md

# Task 0 — Report data model + helper

## Context
We’ll persist each run as a “Report” row in Supabase (compatible with the
`supabase_helpers` already in repo).

## Changes
```diff
+ api/src/app/db/reports.py
+ api/migrations/202405__/create_reports.sql

*** ✨ db/reports.py ***
from datetime import datetime
from typing import Any, Dict
from app.util.supabase_helpers import get_supabase

SUPA = get_supabase()
TABLE = "reports"

def create_report(user_id: str, task_id: str, inputs: Dict[str, Any]) -> str:
    resp = SUPA.table(TABLE).insert(
        {
            "user_id": user_id,
            "task_id": task_id,
            "inputs": inputs,
            "status": "running",
            "created_at": datetime.utcnow().isoformat()
        }
    ).execute()
    return resp.data[0]["id"]

def complete_report(report_id: str, output_json: Dict[str, Any]):
    SUPA.table(TABLE).update(
        {"status": "completed", "output_json": output_json}
    ).eq("id", report_id).execute()

def get_report(report_id: str, user_id: str):
    resp = (
        SUPA.table(TABLE)
        .select("*")
        .eq("id", report_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return resp.data

*** ✨ migrations/create_reports.sql ***
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  task_id text not null,
  inputs jsonb not null,
  output_json jsonb,
  status text,
  created_at timestamptz default now()
);

