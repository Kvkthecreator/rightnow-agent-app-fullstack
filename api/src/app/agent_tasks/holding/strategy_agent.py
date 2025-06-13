"""
Module: agent_tasks.strategy_agent

Defines the 'strategy' specialist agent for creating social media strategies.
"""
from agents import Agent

strategy = Agent(
    name="strategy",
    instructions="You create 7-day social strategies. Respond ONLY in structured JSON."
)
