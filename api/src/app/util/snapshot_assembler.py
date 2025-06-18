"""Assemble read-only snapshot data for a basket."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

_ALLOWED_STATES = {"ACCEPTED", "LOCKED", "CONSTANT"}


def assemble_snapshot(
    raw_dumps: Iterable[dict[str, Any]], blocks: Iterable[dict[str, Any]]
) -> dict[str, Any]:
    """Return snapshot dict joining dumps and selected blocks."""
    dumps = sorted(raw_dumps, key=lambda d: d.get("created_at", ""))
    latest_dump = dumps[-1]["body_md"] if dumps else ""

    accepted_blocks: list[dict[str, Any]] = []
    locked_blocks: list[dict[str, Any]] = []
    constants: list[dict[str, Any]] = []

    for b in blocks:
        state = b.get("state")
        if state not in _ALLOWED_STATES:
            continue
        if state == "ACCEPTED":
            accepted_blocks.append(b)
        elif state == "LOCKED":
            locked_blocks.append(b)
        elif state == "CONSTANT":
            constants.append(b)

    return {
        "raw_dump": latest_dump,
        "accepted_blocks": accepted_blocks,
        "locked_blocks": locked_blocks,
        "constants": constants,
    }
