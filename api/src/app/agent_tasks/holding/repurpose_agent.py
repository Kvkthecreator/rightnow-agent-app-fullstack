"""
Module: agent_tasks.repurpose_agent

Defines the 'repurpose' specialist agent for repurposing content.
"""
from agents import Agent

repurpose = Agent(
    name="repurpose",
    instructions="You repurpose content. Respond ONLY in structured JSON."
)
