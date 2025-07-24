from app.agents.tasks import tasks_editor_agent as doc_scaffold_agent
from app.agents.runtime import infra_observer_agent as orch_block_manager_agent
from .context_extractor_agent import run as context_extractor_agent


async def run_agent_chain(basket_id: str) -> None:
    """Run default agent chain for new basket."""
    await doc_scaffold_agent.run(basket_id)
    await orch_block_manager_agent.run(basket_id)
    await context_extractor_agent(basket_id)

