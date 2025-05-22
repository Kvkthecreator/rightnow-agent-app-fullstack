"""
API routes for report retrieval.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.db.reports import get_report
from app.util.auth_helpers import current_user_id

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/{report_id}")
async def read_report(report_id: str, user_id: str = Depends(current_user_id)):
    """
    Fetch the report for the given report_id and authenticated user.
    """
    data = get_report(report_id, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
    return data