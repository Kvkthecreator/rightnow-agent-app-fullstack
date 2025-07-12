import json
import logging
import os
from uuid import uuid4

from app.utils.supabase_client import supabase_client as supabase
from app.utils.db import json_safe
from app.utils.event_log import log_event

log = logging.getLogger("uvicorn.error")
_DEFAULT_MODEL = "gpt-3.5-turbo"


async def run(basket_id: str) -> None:
    """Extract key entities from raw dumps into context_items."""
    try:
        b_resp = (
            supabase.table("baskets")
            .select("workspace_id")
            .eq("id", basket_id)
            .single()
            .execute()
        )
        workspace_id = (
            b_resp.data["workspace_id"] if hasattr(b_resp, "data") else b_resp.json()["workspace_id"]
        )
    except Exception as err:  # noqa: BLE001
        log.exception("context extractor basket lookup failed")
        raise RuntimeError("basket lookup failed") from err

    try:
        d_resp = (
            supabase.table("raw_dumps")
            .select("body_md")
            .eq("basket_id", basket_id)
            .execute()
        )
        dumps: list[dict] = d_resp.data if hasattr(d_resp, "data") else d_resp.json()
    except Exception as err:  # noqa: BLE001
        log.exception("context extractor dumps query failed")
        raise RuntimeError("raw dump lookup failed") from err

    body_concat = "\n\n".join(d.get("body_md", "") for d in dumps)

    entities: list[str] = []
    if "OPENAI_API_KEY" in os.environ:
        import openai

        openai.api_key = os.environ["OPENAI_API_KEY"]
        try:  # pragma: no cover - network call
            completion = openai.ChatCompletion.create(
                model=_DEFAULT_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Return JSON array of up to 10 key entities from the text:",
                    },
                    {"role": "user", "content": body_concat[:2000]},
                ],
                temperature=0.3,
                max_tokens=128,
            )
            txt = completion.choices[0].message.content.strip()
            entities = json.loads(txt)
            if not isinstance(entities, list):
                entities = []
        except Exception:  # noqa: BLE001 - pragma: no cover
            log.exception("openai entity extraction failed")
            entities = []

    if not entities:
        entities = ["General Context"]

    for ent in entities:
        try:
            supabase.table("context_items").insert(
                json_safe(
                    {
                        "id": str(uuid4()),
                        "basket_id": basket_id,
                        "workspace_id": workspace_id,
                        "type": "entity",
                        "content": str(ent),
                        "status": "active",
                    }
                )
            ).execute()
        except Exception as err:  # noqa: BLE001
            log.exception("context item insert failed")
            raise RuntimeError("context item insert failed") from err
    await log_event(
        basket_id=basket_id,
        agent="context_extractor_agent",
        phase="success",
        payload={"count": len(entities)},
    )

