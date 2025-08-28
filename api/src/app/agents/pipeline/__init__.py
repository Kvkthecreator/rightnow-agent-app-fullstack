"""
Canonical Pipeline Agents - YARNNN Canon v1.4.0 Compliant

Each agent maps to exactly one pipeline (P0-P4) with strict boundary enforcement.
This eliminates canon violations and ensures proper substrate processing.

Pipeline Agents:
- P0CaptureAgent: Only writes raw_dumps, never interprets
- P1SubstrateAgent: Creates blocks/context_items, never relationships  
- P2GraphAgent: Creates relationships, never modifies substrate
- P3ReflectionAgent: Read-only computation, optionally cached
- P4PresentationAgent: Consumes substrate for narrative, never creates it
"""

from .capture_agent import P0CaptureAgent
from .substrate_agent import P1SubstrateAgent  
from .graph_agent import P2GraphAgent
from .reflection_agent import P3ReflectionAgent
from .presentation_agent import P4PresentationAgent

__all__ = [
    "P0CaptureAgent",
    "P1SubstrateAgent", 
    "P2GraphAgent",
    "P3ReflectionAgent",
    "P4PresentationAgent"
]