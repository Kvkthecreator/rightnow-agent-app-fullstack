from .orch import doc_scaffold_agent, orch_block_manager_agent
from .context_extractor_agent import run as context_extractor_agent


async def run_agent_chain(basket_id: str) -> None:
    """Run default agent chain for new basket."""
    await doc_scaffold_agent.run(basket_id)
    await orch_block_manager_agent.run(basket_id)
    await context_extractor_agent(basket_id)

