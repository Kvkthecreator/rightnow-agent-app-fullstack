"""
Context Envelope Generator.

Generates P4 document "context envelopes" that provide agents with:
1. Project summary and key knowledge
2. Recent activity and timeline events
3. Queryable substrate references

This becomes the agent's "mission brief" for work execution.
"""

import logging
from typing import Dict, Any, List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from clients.substrate_client import SubstrateClient

logger = logging.getLogger("uvicorn.error")


class ContextEnvelopeGenerator:
    """
    Generates context envelopes (P4 documents) for agent work sessions.

    A context envelope provides the agent with:
    - Project summary and goals
    - Key knowledge blocks from the basket
    - Recent timeline events
    - Queryable substrate information
    """

    def __init__(self, substrate_client: SubstrateClient):
        self.substrate = substrate_client

    async def generate_project_context_envelope(
        self,
        project_id: UUID,
        basket_id: UUID,
        agent_type: str,
        focus_blocks: Optional[List[UUID]] = None
    ) -> Dict[str, Any]:
        """
        Generate a context envelope for agent execution.

        Args:
            project_id: Project UUID
            basket_id: Associated basket UUID (1:1 with project)
            agent_type: 'research' | 'content' | 'reporting'
            focus_blocks: Specific block IDs to prioritize (optional)

        Returns:
            Context envelope dict with:
            - envelope_type: "project_context_snapshot"
            - project_id, basket_id, generated_at
            - composition: {summary, key_knowledge, recent_activity}
            - available_blocks: {count, by_type, query_endpoint}
        """

        logger.info(
            f"Generating context envelope for project {project_id}, "
            f"basket {basket_id}, agent_type {agent_type}"
        )

        try:
            # Get basket signature (summary, anchors, entities, keywords)
            basket_signature = await self.substrate.get_basket_signature(basket_id)

            # Get recent blocks from basket
            recent_blocks = await self.substrate.get_basket_blocks(
                basket_id=basket_id,
                limit=20,
                order_by="created_at_desc"
            )

            # Get timeline events (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            timeline_events = await self.substrate.get_timeline_events(
                basket_id=basket_id,
                since=cutoff_date,
                limit=10
            )

            # Agent-specific block filtering
            key_blocks = self._filter_blocks_by_agent_type(
                blocks=recent_blocks,
                agent_type=agent_type,
                focus_blocks=focus_blocks
            )

            # Build composition
            composition = {
                "summary": {
                    "narrative": self._generate_summary_narrative(
                        basket_signature, key_blocks
                    ),
                    "substrate_refs": [
                        {
                            "type": "context_block",
                            "id": str(block["id"]),
                            "title": block.get("title", "Untitled"),
                            "semantic_type": block.get("semantic_type"),
                        }
                        for block in key_blocks[:5]  # Top 5 blocks
                    ],
                },
                "key_knowledge": {
                    "narrative": self._generate_knowledge_narrative(
                        agent_type, key_blocks
                    ),
                    "substrate_refs": [
                        {
                            "type": "context_block",
                            "id": str(block["id"]),
                            "title": block.get("title", "Untitled"),
                            "semantic_type": block.get("semantic_type"),
                            "content_preview": block.get("content", "")[:200],
                        }
                        for block in key_blocks[:10]
                    ],
                },
                "recent_activity": {
                    "timeline_events": [
                        {
                            "type": "timeline_event",
                            "id": str(event["id"]),
                            "event_type": event.get("event_type"),
                            "summary": event.get("summary", ""),
                            "occurred_at": event.get("occurred_at"),
                        }
                        for event in timeline_events
                    ],
                },
            }

            # Build envelope
            envelope = {
                "envelope_type": "project_context_snapshot",
                "project_id": str(project_id),
                "basket_id": str(basket_id),
                "agent_type": agent_type,
                "generated_at": datetime.utcnow().isoformat(),
                "composition": composition,
                "available_blocks": {
                    "count": len(recent_blocks),
                    "by_type": self._count_blocks_by_type(recent_blocks),
                    "query_endpoint": f"/api/baskets/{basket_id}/blocks",
                },
                "basket_signature": {
                    "summary": basket_signature.get("summary"),
                    "anchors": basket_signature.get("anchors", []),
                    "entities": basket_signature.get("entities", []),
                    "keywords": basket_signature.get("keywords", []),
                },
            }

            logger.info(
                f"Generated context envelope with {len(key_blocks)} key blocks, "
                f"{len(timeline_events)} timeline events"
            )

            return envelope

        except Exception as e:
            logger.error(f"Failed to generate context envelope: {e}", exc_info=True)
            # Return minimal envelope on error
            return {
                "envelope_type": "project_context_snapshot",
                "project_id": str(project_id),
                "basket_id": str(basket_id),
                "agent_type": agent_type,
                "generated_at": datetime.utcnow().isoformat(),
                "composition": {
                    "summary": {
                        "narrative": "Context envelope generation failed. Agent will query substrate directly.",
                        "substrate_refs": [],
                    }
                },
                "available_blocks": {
                    "count": 0,
                    "by_type": {},
                    "query_endpoint": f"/api/baskets/{basket_id}/blocks",
                },
                "error": str(e),
            }

    def _filter_blocks_by_agent_type(
        self,
        blocks: List[Dict[str, Any]],
        agent_type: str,
        focus_blocks: Optional[List[UUID]] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter blocks based on agent type relevance.

        Research: facts, metrics, entities, intents
        Content: guidelines, examples, brand_voice
        Reporting: metrics, kpis, timeline_events
        """

        if focus_blocks:
            # Prioritize explicitly requested blocks
            focus_ids = set(str(bid) for bid in focus_blocks)
            prioritized = [b for b in blocks if str(b["id"]) in focus_ids]
            others = [b for b in blocks if str(b["id"]) not in focus_ids]
            return prioritized + others[:10]

        # Agent-specific semantic type priorities
        semantic_priorities = {
            "research": ["fact", "metric", "entity", "intent", "insight"],
            "content": ["guideline", "example", "entity", "intent"],
            "reporting": ["metric", "kpi", "fact", "timeline_summary"],
        }

        priorities = semantic_priorities.get(agent_type, [])

        # Sort by semantic type priority
        def priority_score(block):
            semantic_type = block.get("semantic_type", "")
            try:
                return priorities.index(semantic_type)
            except ValueError:
                return len(priorities)  # Lower priority for non-matching types

        return sorted(blocks, key=priority_score)[:15]

    def _generate_summary_narrative(
        self, basket_signature: Dict[str, Any], key_blocks: List[Dict[str, Any]]
    ) -> str:
        """Generate human-readable summary narrative."""

        summary = basket_signature.get("summary", "")
        anchors = basket_signature.get("anchors", [])

        if summary:
            narrative = f"{summary}\n\n"
        else:
            narrative = "This project contains knowledge across multiple domains.\n\n"

        if anchors:
            anchor_text = ", ".join(anchors[:5])
            narrative += f"Key concepts: {anchor_text}."

        if key_blocks:
            narrative += f"\n\nThe knowledge base contains {len(key_blocks)} relevant blocks."

        return narrative.strip()

    def _generate_knowledge_narrative(
        self, agent_type: str, key_blocks: List[Dict[str, Any]]
    ) -> str:
        """Generate agent-specific knowledge narrative."""

        agent_intros = {
            "research": "Research focus areas based on existing knowledge:",
            "content": "Brand voice and content guidelines from existing knowledge:",
            "reporting": "Key metrics and data points to consider:",
        }

        intro = agent_intros.get(agent_type, "Relevant knowledge:")

        if not key_blocks:
            return f"{intro} (No blocks yet - this is a new project)"

        # List top 3 block titles
        titles = [
            block.get("title", "Untitled") for block in key_blocks[:3]
        ]

        return f"{intro}\n- " + "\n- ".join(titles)

    def _count_blocks_by_type(
        self, blocks: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """Count blocks by semantic type."""

        counts: Dict[str, int] = {}
        for block in blocks:
            semantic_type = block.get("semantic_type", "unknown")
            counts[semantic_type] = counts.get(semantic_type, 0) + 1

        return counts

    async def store_envelope_as_document(
        self,
        envelope: Dict[str, Any],
        basket_id: UUID
    ) -> UUID:
        """
        Store context envelope as a P4 document in substrate.

        Returns:
            Document ID (UUID)
        """

        try:
            # Create P4 document via substrate-api
            document_id = await self.substrate.create_document(
                basket_id=basket_id,
                document_type="project_context_envelope",
                title=f"Context Envelope - {envelope.get('generated_at')}",
                composition_type="substrate_plus_narrative",
                substrate_references=envelope["composition"]["summary"]["substrate_refs"],
                narrative_sections=[
                    {
                        "heading": "Summary",
                        "content": envelope["composition"]["summary"]["narrative"],
                    },
                    {
                        "heading": "Key Knowledge",
                        "content": envelope["composition"]["key_knowledge"]["narrative"],
                    },
                ],
                metadata={
                    "envelope_type": envelope["envelope_type"],
                    "agent_type": envelope["agent_type"],
                    "project_id": envelope["project_id"],
                },
            )

            logger.info(f"Stored context envelope as document {document_id}")
            return document_id

        except Exception as e:
            logger.error(f"Failed to store context envelope as document: {e}")
            raise
