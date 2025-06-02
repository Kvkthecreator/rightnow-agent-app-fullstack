"""
Module: agent_tasks.content_agent

Defines the 'content' specialist agent for writing brand-aligned social posts.
"""
from agents import Agent

content = Agent(
    name="content",
    instructions="You write brand-aligned social posts. Respond ONLY in structured JSON."
)