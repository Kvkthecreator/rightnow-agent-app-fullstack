"""
API routes for report retrieval.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.db.reports import get_report, list_reports_for_user
from app.util.auth_helpers import current_user_id

router = APIRouter(prefix="/reports", tags=["reports"])
 
# --------------------------------------------------------------------------- #
#  LIST (gallery view)                                                        #
# --------------------------------------------------------------------------- #

@router.get("/")
async def list_all_reports(user_id: str = Depends(current_user_id)):
    """
    Return all reports that belong to the authenticated user,
    sorted newest first.
    """
    return list_reports_for_user(user_id)

@router.get("/{report_id}")
async def read_report(report_id: str, user_id: str = Depends(current_user_id)):
    """
    Fetch the report for the given report_id and authenticated user.
    """
    data = get_report(report_id, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="Report not found")
    return data