"""Compare newly parsed context blocks with existing ones."""

from typing import List, Optional, Literal
from difflib import SequenceMatcher

from pydantic import BaseModel

from .orch_basket_parser_agent import ContextBlock, run as parse_blocks
from ..layer1_infra.utils.supabase_helpers import get_supabase


class DiffBlock(BaseModel):
    """Diff result for a context block."""

    type: Literal["added", "modified", "unchanged"]
    new_block: ContextBlock
    old_block: Optional[ContextBlock] = None
    reason: Optional[str] = None


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def run(basket_id: str) -> List[DiffBlock]:
    """Reparse basket artifacts and diff against stored context blocks."""

    supabase = get_supabase()

    # fetch basket user id
    basket_resp = (
        supabase.table("baskets").select("user_id").eq("id", basket_id).maybe_single().execute()
    )
    if not basket_resp.data:
        raise ValueError("basket not found")
    user_id = basket_resp.data["user_id"]

    # fetch artifacts
    art_resp = supabase.table("dump_artifacts").select("*").eq("basket_id", basket_id).execute()
    artifacts = art_resp.data or []

    new_blocks = parse_blocks(basket_id, artifacts, user_id)

    # fetch existing blocks
    blk_resp = supabase.table("context_blocks").select("*").eq("basket_id", basket_id).execute()
    old_data = blk_resp.data or []
    old_blocks = [ContextBlock(**b) for b in old_data]

    diffs: List[DiffBlock] = []
    used_old_ids = set()

    for nb in new_blocks:
        best_match = None
        best_ratio = 0.0
        for ob in old_blocks:
            if ob.id in used_old_ids:
                continue
            sim = _similarity(nb.label or nb.content or "", ob.label or ob.content or "")
            if sim > best_ratio:
                best_ratio = sim
                best_match = ob
        if best_match and best_ratio >= 0.8:
            used_old_ids.add(best_match.id)
            if _normalize(nb.content or "") != _normalize(best_match.content or ""):
                diffs.append(
                    DiffBlock(type="modified", new_block=nb, old_block=best_match, reason="content changed")
                )
            else:
                diffs.append(DiffBlock(type="unchanged", new_block=nb, old_block=best_match))
        else:
            diffs.append(DiffBlock(type="added", new_block=nb))

    return diffs
