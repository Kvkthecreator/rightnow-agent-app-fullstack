from typing import List, Dict

from .orch_block_diff_agent import DiffBlock
from ..layer1_infra.utils.supabase_helpers import get_supabase


async def apply_diffs(
    basket_id: str, diffs: List[DiffBlock], dry_run: bool = False
) -> Dict[str, int]:
    """Apply DiffBlock changes to the context_blocks table.

    Parameters
    ----------
    basket_id: str
        Identifier for the basket the diffs belong to.
    diffs: List[DiffBlock]
        Diff results from ``orch_block_diff_agent``.
    dry_run: bool, optional
        If True, only log actions without persisting changes.

    Returns
    -------
    dict
        Summary of operations performed.
    """
    supabase = get_supabase()

    added = modified = unchanged = 0
    for diff in diffs:
        if diff.type == "added":
            added += 1
            if dry_run:
                print(f"[dry-run] insert block: {diff.new_block.label}")
            else:
                supabase.table("context_blocks").insert(
                    diff.new_block.model_dump()
                ).execute()
        elif diff.type == "modified":
            modified += 1
            if diff.old_block and diff.old_block.id:
                if dry_run:
                    print(f"[dry-run] update block {diff.old_block.id}")
                else:
                    supabase.table("context_blocks").update(
                        diff.new_block.model_dump()
                    ).eq("id", diff.old_block.id).execute()
        else:
            unchanged += 1

    return {"added": added, "modified": modified, "unchanged": unchanged}
