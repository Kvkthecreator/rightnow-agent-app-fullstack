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
from .improved_substrate_agent import ImprovedP1SubstrateAgent
from .substrate_agent_v2 import P1SubstrateAgentV2  # Legacy support
from .graph_agent import P2GraphAgent
from .reflection_agent import P3ReflectionAgent
from .presentation_agent import P4PresentationAgent

# Primary P1 agent (improved quality)
P1SubstrateAgent = ImprovedP1SubstrateAgent

# Legacy compatibility
P1SubstrateAgentV2_Legacy = P1SubstrateAgentV2

__all__ = [
    "P0CaptureAgent",
    "P1SubstrateAgent",
    "ImprovedP1SubstrateAgent", 
    "P1SubstrateAgentV2",
    "P2GraphAgent", 
    "P3ReflectionAgent",
    "P4PresentationAgent"
]