"""Apply parsed block diffs for a basket via CLI."""

import argparse
import asyncio

from app.agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase
from app.agent_tasks.orch.apply_diff_blocks import apply_diffs
from app.orchestration.triggers.on_basket_created import run as parse_blocks
from app.agent_tasks.orch.orch_block_diff_agent import run as diff_blocks


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply block diffs to a basket")
    parser.add_argument("basket_id")
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview changes without DB writes"
    )
    args = parser.parse_args()

    supabase = get_supabase()

    # Fetch artifacts for completeness (parsed but unused directly)
    art_resp = (
        supabase.table("dump_artifacts")
        .select("*")
        .eq("basket_id", args.basket_id)
        .execute()
    )
    artifacts = art_resp.data or []
    user_resp = (
        supabase.table("baskets")
        .select("user_id")
        .eq("id", args.basket_id)
        .maybe_single()
        .execute()
    )
    user_id = user_resp.data["user_id"] if user_resp.data else None

    # Parse blocks (result not used here but mimics pipeline step)
    _ = parse_blocks(args.basket_id, artifacts, user_id).blocks

    diffs = diff_blocks(args.basket_id)
    result = asyncio.run(apply_diffs(args.basket_id, diffs, dry_run=args.dry_run))

    if args.dry_run:
        print("\N{HEAVY CHECK MARK}️ Dry run complete")
    print(f"\N{HEAVY PLUS SIGN} Added: {result['added']}")
    print(f"\N{CLOCKWISE OPEN CIRCLE ARROW} Modified: {result['modified']}")
    print(f"\N{WHITE HEAVY CHECK MARK} Unchanged: {result['unchanged']}")


if __name__ == "__main__":
    main()
