from schemas.block_diff import DiffBlock
from schemas.dump_parser import ContextBlock
from src.utils.db import json_safe

from ..layer1_infra.utils.supabase_helpers import get_supabase


def serialize_block(block: ContextBlock) -> dict:
    """Serialize a block, skipping unset optional fields."""
    return block.model_dump(mode="json", exclude_none=True)


async def apply_diffs(
    basket_id: str, diffs: list[DiffBlock], dry_run: bool = False
) -> dict[str, int]:
    """Apply DiffBlock changes to the context_blocks table."""

    supabase = get_supabase()

    added = modified = unchanged = 0
    for diff in diffs:
        # handle legacy dicts
        new_block = (
            diff.new_block
            if isinstance(diff.new_block, ContextBlock)
            else ContextBlock.model_validate(diff.new_block)
        )
        old_block = None
        if diff.old_block:
            old_block = (
                diff.old_block
                if isinstance(diff.old_block, ContextBlock)
                else ContextBlock.model_validate(diff.old_block)
            )

        if diff.type == "added":
            added += 1
            if dry_run:
                print(f"[dry-run] insert block: {new_block.label}")
            else:
                safe_block = new_block.model_dump(exclude_none=True)
                #  🔗 write FK for fast look-ups
                safe_block["basket_id"] = basket_id
                resp = supabase.table("context_blocks").insert(json_safe(safe_block)).execute()
                if resp.data and resp.data[0].get("id"):
                    supabase.table("block_brief_link").insert(
                        json_safe(
                            {
                                "block_id": resp.data[0]["id"],
                                "task_brief_id": basket_id,
                                "transformation": "source",
                            }
                        )
                    ).execute()

        elif diff.type == "modified":
            modified += 1
            if old_block and old_block.id:
                if dry_run:
                    print(f"[dry-run] update block {old_block.id}")
                else:
                    safe_block = serialize_block(new_block)
                    (
                        supabase.table("context_blocks")
                        .update(json_safe(safe_block))
                        .eq("id", old_block.id)
                        .execute()
                    )

        else:
            unchanged += 1

    return {"added": added, "modified": modified, "unchanged": unchanged}
