import uuid, json, asyncpg, os, openai, datetime, asyncio, sys
from typing import List
from app.event_bus import emit as publish_event
from ..schemas import ComposeRequest, TaskBriefDraft
from ..utils.prompt_builder import build_prompt

EVENT_TOPIC = "brief.draft_created"
openai.api_key = os.getenv("OPENAI_API_KEY")

async def compose(req: ComposeRequest) -> TaskBriefDraft:
    db_url = os.getenv("DATABASE_URL")
    print("[debug] DATABASE_URL =", db_url)
    print("[debug] Compose input:", req.model_dump())

    conn = await asyncpg.connect(db_url)
    try:
        # Get context blocks
        if req.block_ids:
            rows = await conn.fetch(
                "SELECT id, label, type, content FROM context_blocks WHERE id = ANY($1::uuid[])",
                req.block_ids,
            )
        else:
            rows = await conn.fetch(
                "SELECT id, label, type, content FROM context_blocks WHERE user_id = $1 ORDER BY importance DESC LIMIT 5",
                req.user_id,
            )
        print(f"[debug] Using {len(rows)} context blocks")

        prompt = build_prompt(req.user_intent, req.sub_instructions, rows, req.file_urls)

        # Generate outline
        resp = await openai.ChatCompletion.acreate(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        outline = resp.choices[0].message.content.strip()
        print("[debug] Generated outline:", outline[:160], "...")

        brief_id = str(uuid.uuid4())
        now = datetime.datetime.utcnow()

        # Insert draft into DB
        await conn.execute(
            """
            INSERT INTO public.task_briefs (
                id, user_id, intent, sub_instructions, media,
                block_ids, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            brief_id,
            req.user_id,
            req.user_intent,
            req.sub_instructions,
            req.file_urls,
            [r["id"] for r in rows],
            "draft",
            now,
        )
        print(f"[debug] Inserted brief: {brief_id}")

    finally:
        await conn.close()

    draft = TaskBriefDraft(
        brief_id=brief_id,
        user_id=req.user_id,
        user_intent=req.user_intent,
        sub_instructions=req.sub_instructions,
        file_urls=req.file_urls,
        block_ids=[r["id"] for r in rows],
        outline=outline,
        created_at=now,
    )

    await publish_event(EVENT_TOPIC, json.loads(draft.json()))
    print("[debug] Event published")
    return draft

# CLI helper
if __name__ == "__main__":
    payload = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {
        "user_id": "demo",
        "user_intent": "Launch a spring sale campaign on social media.",
        "sub_instructions": "",
        "file_urls": [],
        "block_ids": []
    }
    asyncio.run(compose(ComposeRequest(**payload)))
