"""CLI to reparse basket artifacts and show diff results."""

import sys

from app.agent_tasks.orch.orch_block_diff_agent import run as diff_blocks


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/reparse_and_diff_basket.py <basket_id>")
        return
    basket_id = sys.argv[1]
    diffs = diff_blocks(basket_id)
    added = sum(1 for d in diffs if d.type == "added")
    modified = sum(1 for d in diffs if d.type == "modified")
    unchanged = sum(1 for d in diffs if d.type == "unchanged")
    print(f"added: {added}, modified: {modified}, unchanged: {unchanged}")


if __name__ == "__main__":
    main()
