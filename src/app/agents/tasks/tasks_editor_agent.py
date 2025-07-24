import os
import logging
from typing import Any

from app.utils.supabase_client import supabase_client as supabase
from app.utils.db import json_safe
from app.utils.event_log import log_event

log = logging.getLogger("uvicorn.error")
_DEFAULT_MODEL = "gpt-3.5-turbo"


async def run(basket_id: str) -> None:
    """Generate titles for each raw dump/document pair."""
    try:
        resp = (
            supabase.table("raw_dumps")
            .select("id,document_id,body_md")
            .eq("basket_id", basket_id)
            .execute()
        )
        dumps: list[dict[str, Any]] = resp.data if hasattr(resp, "data") else resp.json()
    except Exception as err:  # noqa: BLE001
        log.exception("doc_scaffold dump query failed")
        raise RuntimeError("raw dump lookup failed") from err

    if not dumps:
        return

    if "OPENAI_API_KEY" in os.environ:
        import openai  # runtime import

        openai.api_key = os.environ["OPENAI_API_KEY"]
    else:  # pragma: no cover - requires network
        openai = None

    for row in dumps:
        doc_id = row.get("document_id")
        if not doc_id:
            continue
        title = "Untitled"
        body = (row.get("body_md") or "")[:2000]
        if openai:
            try:  # pragma: no cover - network call
                completion = openai.ChatCompletion.create(
                    model=_DEFAULT_MODEL,
                    messages=[
                        {
                            "role": "system",
                            "content": "Return a concise 3-5 word title for this markdown:",
                        },
                        {"role": "user", "content": body},
                    ],
                    temperature=0.3,
                    max_tokens=8,
                )
                title = completion.choices[0].message.content.strip()
            except Exception:  # noqa: BLE001 - pragma: no cover
                log.exception("openai title failed")
        try:
            supabase.table("documents").update(json_safe({"title": title})).eq("id", doc_id).execute()
        except Exception as err:  # noqa: BLE001
            log.exception("doc_scaffold update failed for %s", doc_id)
            raise RuntimeError("document update failed") from err
        await log_event(
            basket_id=basket_id,
            agent="doc_scaffold_agent",
            phase="success",
            payload={"document_id": doc_id, "title": title},
        )

