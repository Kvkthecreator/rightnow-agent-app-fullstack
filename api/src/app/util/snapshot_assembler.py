"""Assemble read-only snapshot data for a basket."""
from __future__ import annotations

from typing import Iterable, List, Dict, Any


_ALLOWED_STATES = {"ACCEPTED", "LOCKED", "CONSTANT"}


def assemble_snapshot(raw_dumps: Iterable[Dict[str, Any]], blocks: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
    """Return snapshot dict joining dumps and selected blocks."""
    dumps = list(raw_dumps)
    accepted_blocks = [b for b in blocks if b.get("state") in _ALLOWED_STATES]
    return {"raw_dumps": dumps, "blocks": accepted_blocks}
