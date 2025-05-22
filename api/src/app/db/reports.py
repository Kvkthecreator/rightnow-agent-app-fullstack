from datetime import datetime
from typing import Any, Dict
from app.util.supabase_helpers import get_supabase

SUPA = get_supabase()
TABLE = "reports"

def create_report(user_id: str, task_id: str, inputs: Dict[str, Any]) -> str:
    """Insert a new report row and return its generated ID."""
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

def complete_report(report_id: str, output_json: Dict[str, Any]) -> None:
    """Mark the report as completed and store the output JSON."""
    SUPA.table(TABLE).update(
        {"status": "completed", "output_json": output_json}
    ).eq("id", report_id).execute()

def get_report(report_id: str, user_id: str) -> Dict[str, Any]:
    """Fetch a single report by ID and user."""
    resp = (
        SUPA.table(TABLE)
        .select("*")
        .eq("id", report_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return resp.data
    
# NEW -----------------------------------------------------------------
def list_reports_for_user(user_id: str) -> list[dict]:
    """
    Return the user’s reports ordered newest-first.
    """
    supabase = get_supabase()
    res = (
        supabase.table("reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []