"""
/api/baskets/{basket_id}/commits
"""

from fastapi import APIRouter, Query

from ..utils.supabase_client import supabase_client as supabase

router = APIRouter(prefix="/api", tags=["commits"])


def _commit_stats(cid: str) -> tuple[int | None, int | None, int | None]:
    new_blocks = (
        supabase.table("context_blocks")
        .select("id", count="exact")
        .eq("commit_id", cid)
        .execute()
        .count  # type: ignore[attr-defined]
    )
    supersedes = (
        supabase.table("block_change_queue")
        .select("id", count="exact")
        .eq("commit_id", cid)
        .execute()
        .count  # type: ignore[attr-defined]
    )
    edited_blocks = (
        supabase.table("context_blocks")
        .select("id", count="exact")
        .eq("commit_id", cid)
        .gt("version", 1)
        .execute()
        .count  # type: ignore[attr-defined]
    )
    return new_blocks, edited_blocks, supersedes


@router.get("/baskets/{basket_id}/commits")
def list_commits(
    basket_id: str,
    limit: int = Query(20, le=100),
    offset: int = 0,
) -> list[dict]:
    resp = (
        supabase.table("dump_commits")
        .select("*")
        .eq("basket_id", basket_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    commits = []
    for row in resp.data:  # type: ignore[attr-defined]
        nb, eb, sp = _commit_stats(row["id"])
        commits.append(
            {
                "id": row["id"],
                "created_at": row["created_at"],
                "summary": row["summary"],
                "new_blocks": nb,
                "edited_blocks": eb,
                "supersedes": sp,
            }
        )
    return commits
