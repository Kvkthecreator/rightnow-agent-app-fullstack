import asyncio
import pytest

from app.agent_tasks.layer1_infra.agents.infra_analyzer_agent import (
    run,
    EVENT_TOPIC,
)
from app.event_bus import subscribe

@pytest.mark.asyncio
async def test_analyzer_emits_event(postgres_clean):
    # listen for the event
    async with subscribe([EVENT_TOPIC]) as q:

        # insert two duplicate blocks
        await postgres_clean.execute("""
          insert into context_blocks(id, label)
          values ('00000000-0000-0000-0000-000000000001','Dup'),
                 ('00000000-0000-0000-0000-000000000002','dup');
        """)

        report = await run()
        assert report.ok is False

        evt = await asyncio.wait_for(q.get(), timeout=2)
        assert evt.topic == EVENT_TOPIC
        assert evt.payload["duplicate_labels"]
