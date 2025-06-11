from schemas.block_diff import DiffBlock
from schemas.dump_parser import ContextBlock

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
        if diff.type == "added":
            added += 1
            if dry_run:
                print(f"[dry-run] insert block: {diff.new_block.label}")
            else:
                safe_block = serialize_block(diff.new_block)
                resp = supabase.table("context_blocks").insert(safe_block).execute()
                if resp.data and resp.data[0].get("id"):
                    supabase.table("block_brief_link").insert(
                        {
                            "block_id": resp.data[0]["id"],
                            "task_brief_id": basket_id,
                            "transformation": "source",
                        }
                    ).execute()

        elif diff.type == "modified":
            modified += 1
            if diff.old_block and diff.old_block.id:
                if dry_run:
                    print(f"[dry-run] update block {diff.old_block.id}")
                else:
                    safe_block = serialize_block(diff.new_block)
                    (
                        supabase.table("context_blocks")
                        .update(safe_block)
                        .eq("id", diff.old_block.id)
                        .execute()
                    )

        else:
            unchanged += 1

    return {"added": added, "modified": modified, "unchanged": unchanged}
