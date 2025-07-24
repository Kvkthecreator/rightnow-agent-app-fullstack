import asyncpg


# helper shared by all layer-1 agents
# ----------------------------------
async def is_auto(conn: asyncpg.Connection, block_id: str) -> bool:
    row = await conn.fetchrow(
        "select update_policy from public.blocks where id=$1",
        block_id,
    )
    return bool(row and row["update_policy"] == "auto")


async def insert_revision(
    conn: asyncpg.Connection,
    block_id: str,
    *,
    diff_json: dict,
    summary: str,
    actor_id: str | None = None,
    workspace_id: str | None = None,
) -> None:
    if workspace_id is None:
        row = await conn.fetchrow(
            "select workspace_id from public.blocks where id=$1",
            block_id,
        )
        workspace_id = row["workspace_id"] if row else None
    await conn.execute(
        """
        insert into public.block_revisions
          (block_id, workspace_id, actor_id, summary, diff_json)
        values ($1, $2, $3, $4, $5::jsonb)
        """,
        block_id,
        workspace_id,
        actor_id,
        summary,
        diff_json,
    )
