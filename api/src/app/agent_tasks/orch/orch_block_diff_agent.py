"""Compare newly parsed context blocks with existing ones."""

from difflib import SequenceMatcher

from schemas.block_diff import DiffBlock
from schemas.dump_parser import ContextBlock

from ..layer1_infra.utils.supabase_helpers import get_supabase
from .orch_basket_parser_agent import run as parse_blocks


def _normalize(text: str) -> str:
    return " ".join(text.lower().split())


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def run(basket_id: str) -> list[DiffBlock]:
    """Reparse basket artifacts and diff against stored context blocks."""

    supabase = get_supabase()

    # fetch basket user id
    basket_resp = (
        supabase.table("baskets").select("user_id").eq("id", basket_id).maybe_single().execute()
    )
    if not basket_resp.data:
        raise ValueError("basket not found")
    user_id = basket_resp.data["user_id"]

    # fetch inputs as artifacts
    inp_resp = (
        supabase.table("basket_inputs")
        .select("content,file_ids")
        .eq("basket_id", basket_id)
        .execute()
    )
    inputs = inp_resp.data or []

    artifacts = []
    for row in inputs:
        if row.get("content"):
            artifacts.append({"type": "text", "content": row["content"], "file_id": None})

    new_blocks = parse_blocks(basket_id, artifacts, user_id).blocks

    # fetch existing blocks linked to this basket
    blk_resp = (
        supabase.from_("block_brief_link")
        .select("context_blocks(*)")
        .eq("task_brief_id", basket_id)
        .execute()
    )
    old_data = [r["context_blocks"] for r in (blk_resp.data or [])]
    old_blocks = [ContextBlock(**b) for b in old_data]

    diffs: list[DiffBlock] = []
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
                    DiffBlock(
                        type="modified",
                        new_block=nb,
                        old_block=best_match,
                        reason="content changed",
                    )
                )
            else:
                diffs.append(DiffBlock(type="unchanged", new_block=nb, old_block=best_match))
        else:
            diffs.append(DiffBlock(type="added", new_block=nb))

    return diffs
