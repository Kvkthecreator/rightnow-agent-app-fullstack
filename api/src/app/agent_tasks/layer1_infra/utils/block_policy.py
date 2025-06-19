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
    prev_content: str,
    new_content: str,
    changed_by: str,
    proposal_event: dict,
) -> None:
    await conn.execute(
        """
        insert into public.block_revisions
          (block_id, prev_content, new_content, changed_by, proposal_event)
        values ($1, $2, $3, $4, $5::jsonb)
        """,
        block_id,
        prev_content,
        new_content,
        changed_by,
        proposal_event,
    )
