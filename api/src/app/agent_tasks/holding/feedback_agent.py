"""
Module: agent_tasks.feedback_agent

Defines the 'feedback' specialist agent for critiquing content.
"""
from agents import Agent

feedback = Agent(
    name="feedback",
    instructions="You critique content. Respond ONLY in structured JSON."
)
