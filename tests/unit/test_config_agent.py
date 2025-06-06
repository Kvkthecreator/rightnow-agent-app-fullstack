import pytest

from app.agent_tasks.layer3_config.agents.config_agent import generate


@pytest.mark.asyncio
async def test_generate_inserts_config(postgres_clean):
    conn = postgres_clean
    brief_id = "11111111-1111-1111-1111-111111111111"
    user_id = "22222222-2222-2222-2222-222222222222"
    await conn.execute(
        "insert into task_briefs(id, user_id, intent, core_context_snapshot) values($1,$2,'test', '{}')",
        brief_id,
        user_id,
    )

    cfg = await generate(brief_id, user_id)
    assert cfg["brief_id"] == brief_id
    row = await conn.fetchrow("select * from basket_configs where basket_id=$1", brief_id)
    assert row is not None

