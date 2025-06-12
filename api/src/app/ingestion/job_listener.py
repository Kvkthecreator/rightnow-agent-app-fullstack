"""Background worker for ``ingestion_jobs`` queue.

This v0.1 worker polls the ``ingestion_jobs`` table every few seconds and
finalises draft blocks. When a job is processed the corresponding draft block
is updated with placeholder metadata, linked to ``basket_blocks`` and the job
row removed.
"""

from __future__ import annotations

import os
import threading
import time
from typing import Any

from importlib import import_module

try:  # noqa: WPS501
    supabase = import_module("src.utils.supabase_client").supabase_client
except ModuleNotFoundError:  # pragma: no cover - local test path
    supabase = import_module("utils.supabase_client").supabase_client

POLL_INTERVAL = float(os.getenv("INGESTION_POLL_INTERVAL", "2"))


def _fetch_jobs(limit: int = 10) -> list[dict[str, Any]]:
    """Return queued jobs from Supabase."""

    resp = (
        supabase.table("ingestion_jobs")
        .select("*")
        .limit(limit)
        .execute()
    )
    return getattr(resp, "data", [])  # type: ignore[no-any-return]


def _process_job(job: dict[str, Any]) -> None:
    """Process a single job row."""

    block_id = job["draft_block_id"]

    blk_resp = (
        supabase.table("context_blocks").select("*").eq("id", block_id).execute()
    )
    blocks = getattr(blk_resp, "data", [])
    if not blocks:
        supabase.table("ingestion_jobs").delete().eq("id", job["id"]).execute()
        return
    block = blocks[0]

    updates = {
        "is_draft": False,
        "type": block.get("type") or "note",
        "tags": block.get("tags") or [],
    }
    supabase.table("context_blocks").update(updates).eq("id", block_id).execute()

    basket_id = block["basket_id"]
    existing = (
        supabase.table("basket_blocks")
        .select("block_id")
        .eq("basket_id", basket_id)
        .eq("block_id", block_id)
        .execute()
    )
    if not getattr(existing, "data", []):
        supabase.table("basket_blocks").insert(
            {"basket_id": basket_id, "block_id": block_id}
        ).execute()

    supabase.table("ingestion_jobs").delete().eq("id", job["id"]).execute()


def process_once() -> None:
    """Process up to 10 jobs once."""

    for job in _fetch_jobs():
        _process_job(job)


def _worker_loop() -> None:
    while True:
        try:
            jobs = _fetch_jobs()
            for job in jobs:
                _process_job(job)
            if not jobs:
                time.sleep(POLL_INTERVAL)
        except Exception as exc:  # noqa: BLE001
            print("ingestion worker error:", repr(exc))
            time.sleep(POLL_INTERVAL)


def start_background_worker() -> None:
    """Launch the ingestion worker thread."""

    thread = threading.Thread(target=_worker_loop, daemon=True)
    thread.start()

