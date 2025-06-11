import datetime

import httpx
from utils.db import json_safe
from utils.logged_agent import logged

from app.integrations.google_client import DOCS_ENDPOINT, refresh_token

from ..utils.config_to_md import render_markdown


@logged("google_exporter")
async def export_to_doc(user_id: str, brief_id: str, supabase):
    # fetch latest config and integration
    cfg_row = (
        await supabase.from_("brief_configs")
        .select("id,config_json,external_url")
        .eq("brief_id", brief_id)
        .order("version", desc=True)
        .limit(1)
        .single()
    ).data

    integ = (
        await supabase.from_("user_integrations")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", "google")
        .single()
    ).data

    if not integ:
        raise RuntimeError("Google account not connected")

    token = await refresh_token(integ, supabase)
    md = render_markdown(cfg_row["config_json"])
    title = f"Brief – {cfg_row['config_json']['intent'][:40]}"

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient() as cli:
        if cfg_row.get("external_url"):
            doc_id = cfg_row["external_url"].split("/d/")[1].split("/")[0]
            await cli.post(
                f"{DOCS_ENDPOINT}/{doc_id}:batchUpdate",
                headers=headers,
                json={
                    "requests": [
                        {
                            "insertText": {
                                "endOfSegmentLocation": {},
                                "text": "\n\n# Update "
                                + datetime.datetime.utcnow().isoformat()
                                + "\n"
                                + md,
                            }
                        }
                    ]
                },
            )
            link = cfg_row["external_url"]
        else:
            r = await cli.post(DOCS_ENDPOINT, headers=headers, json={"title": title})
            doc_id = r.json()["documentId"]
            await cli.post(
                f"{DOCS_ENDPOINT}/{doc_id}:batchUpdate",
                headers=headers,
                json={"requests": [{"insertText": {"location": {"index": 1}, "text": md}}]},
            )
            link = f"https://docs.google.com/document/d/{doc_id}/edit"
            (
                await supabase.from_("brief_configs")
                .update(json_safe({"external_url": link}))
                .eq("id", cfg_row["id"])
            )

    return link
