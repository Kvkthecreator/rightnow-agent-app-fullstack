from fastapi import APIRouter
from fastapi.responses import JSONResponse
from ..utils.supabase import supabase_admin

router = APIRouter(tags=["health"])

@router.get("/health/sb-admin")
def health_sb_admin():
    """Verify service role access to Supabase."""
    try:
        sb = supabase_admin()
        # cheap call: list 1 workspace id (no data leak)
        res = sb.table("workspaces").select("id").limit(1).execute()
        return JSONResponse({"ok": True, "count": len(res.data)})
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"ok": False, "error": str(e)}
        )