import logging

from fastapi import APIRouter, HTTPException

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(tags=["inputs"])

logger = logging.getLogger("uvicorn.error")


@router.get("/baskets/{basket_id}/inputs")
def list_inputs(basket_id: str) -> list[dict]:
    """Return raw text dumps for a basket ordered by time."""
    try:
        resp = (
            supabase.table("raw_dumps")
            .select("id,content,created_at")
            .eq("basket_id", basket_id)
            .order("created_at")
            .execute()
        )
        return resp.data or []  # type: ignore[attr-defined]
    except Exception as err:
        logger.exception("list_inputs failed")
        raise HTTPException(status_code=500, detail="internal error") from err


@router.get("/baskets/{basket_id}/input-highlights")
def highlight_inputs(basket_id: str) -> list[dict]:
    """Return highlight suggestions comparing inputs to promoted blocks."""
    try:
        in_resp = (
            supabase.table("raw_dumps")
            .select("id,content")
            .eq("basket_id", basket_id)
            .execute()
        )
        blk_resp = (
            supabase.table("blocks")
            .select("id,label,content")
            .eq("basket_id", basket_id)
            .execute()
        )
        inputs = in_resp.data or []
        blocks = blk_resp.data or []
        suggestions: list[dict] = []
        for inp in inputs:
            text = (inp.get("content") or "").lower()
            for blk in blocks:
                label = (blk.get("label") or "").lower()
                content = (blk.get("content") or "").lower()
                if content and content in text or label and label in text:
                    suggestions.append(
                        {
                            "dump_input_id": inp["id"],
                            "conflicting_block_id": blk["id"],
                            "reason": "possible_redundancy",
                        }
                    )
        return suggestions
    except Exception as err:
        logger.exception("highlight_inputs failed")
        raise HTTPException(status_code=500, detail="internal error") from err
