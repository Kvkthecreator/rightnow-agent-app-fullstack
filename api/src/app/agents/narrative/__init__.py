"""
Narrative Agent Layer

This package contains agents that transform technical substrate into user-friendly
narrative intelligence. These agents coordinate with infrastructure agents to
provide human-centered AI assistance.

CRITICAL: These agents must NEVER expose technical substrate vocabulary.
All outputs are crafted for user consumption with narrative language.
"""

from .project_understanding_agent import ProjectUnderstandingAgent
from .ai_assistant_agent import AIAssistantAgent
from .intelligent_guidance_agent import IntelligentGuidanceAgent

__all__ = [
    "ProjectUnderstandingAgent",
    "AIAssistantAgent", 
    "IntelligentGuidanceAgent"
]