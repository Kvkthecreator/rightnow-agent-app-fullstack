"""
MCP Server for Claude Agent SDK Integration (Phase 1).

Provides three MCP tools that bridge Claude Agent SDK with YARNNN substrate-API:
1. query_substrate - Semantic search across knowledge substrate
2. emit_work_output - Create work output deliverables
3. get_reference_assets - Fetch reference files

Technical Notes:
- Uses MCP (Model Context Protocol) standard
- Tools make HTTP requests to substrate-API
- Auth forwarding: service token + user JWT
- Python MCP library: mcp>=1.6.0

Usage:
    from mcp_tools import create_mcp_server

    server = create_mcp_server()
    # Register with Claude Agent SDK

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

import logging
import os
from typing import Any, List, Optional

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

SUBSTRATE_API_URL = os.getenv("SUBSTRATE_API_URL", "https://yarnnn-substrate-api.onrender.com")
SUBSTRATE_SERVICE_SECRET = os.getenv("SUBSTRATE_SERVICE_SECRET", "")

# ============================================================================
# HTTP Client for Substrate-API
# ============================================================================


class SubstrateClient:
    """HTTP client for substrate-API with service-to-service auth."""

    def __init__(self, base_url: str, service_secret: str):
        self.base_url = base_url.rstrip("/")
        self.service_secret = service_secret
        self.client = httpx.AsyncClient(timeout=30.0)

    def _get_headers(self, user_jwt: Optional[str] = None) -> dict:
        """Build headers with service auth + optional user JWT."""
        headers = {
            "X-Service-Name": "platform-api",
            "X-Service-Secret": self.service_secret,
        }
        if user_jwt:
            headers["Authorization"] = f"Bearer {user_jwt}"
        return headers

    async def query_substrate(
        self,
        basket_id: str,
        query_text: str,
        semantic_types: Optional[List[str]] = None,
        anchor_roles: Optional[List[str]] = None,
        states: Optional[List[str]] = None,
        min_similarity: float = 0.70,
        limit: int = 20,
        user_jwt: Optional[str] = None,
    ) -> dict:
        """
        Query substrate blocks using semantic search.

        Args:
            basket_id: Basket ID to search within
            query_text: Natural language query
            semantic_types: Filter by semantic types (fact, constraint, etc.)
            anchor_roles: Filter by anchor roles (problem, solution, etc.)
            states: Filter by block states (ACCEPTED, LOCKED, etc.)
            min_similarity: Minimum similarity score (0-1)
            limit: Maximum results
            user_jwt: Optional user JWT for auth

        Returns:
            List of blocks with similarity scores
        """
        # Call substrate-API semantic search endpoint
        # NOTE: substrate-API will use semantic_primitives.py internally
        url = f"{self.base_url}/api/substrate/search"
        payload = {
            "basket_id": basket_id,
            "query_text": query_text,
            "filters": {
                "semantic_types": semantic_types,
                "anchor_roles": anchor_roles,
                "states": states or ["ACCEPTED", "LOCKED", "CONSTANT"],
                "min_similarity": min_similarity,
            },
            "limit": limit,
        }

        response = await self.client.post(url, json=payload, headers=self._get_headers(user_jwt))
        response.raise_for_status()
        return response.json()

    async def emit_work_output(
        self,
        basket_id: str,
        work_ticket_id: str,
        output_type: str,
        agent_type: str,
        title: str,
        body: dict,
        confidence: float,
        source_context_ids: List[str],
        tool_call_id: Optional[str] = None,
        metadata: Optional[dict] = None,
        user_jwt: Optional[str] = None,
    ) -> dict:
        """
        Create a work output for user supervision.

        Args:
            basket_id: Basket ID
            work_ticket_id: Work session ID
            output_type: finding, recommendation, insight, etc.
            agent_type: research, content, reporting
            title: Output title (max 200 chars)
            body: Structured output body (summary, details, evidence, etc.)
            confidence: Confidence score 0-1
            source_context_ids: Provenance (which blocks were used)
            tool_call_id: Claude's tool_use id for traceability
            metadata: Additional metadata
            user_jwt: Optional user JWT for auth

        Returns:
            Created work output record
        """
        url = f"{self.base_url}/api/baskets/{basket_id}/work-outputs"
        payload = {
            "basket_id": basket_id,
            "work_ticket_id": work_ticket_id,
            "output_type": output_type,
            "agent_type": agent_type,
            "title": title,
            "body": body,
            "confidence": confidence,
            "source_context_ids": source_context_ids,
            "tool_call_id": tool_call_id,
            "metadata": metadata or {},
        }

        response = await self.client.post(url, json=payload, headers=self._get_headers(user_jwt))
        response.raise_for_status()
        return response.json()

    async def get_reference_assets(
        self,
        basket_id: str,
        asset_type: Optional[str] = None,
        agent_scope: Optional[str] = None,
        user_jwt: Optional[str] = None,
    ) -> dict:
        """
        List reference assets for a basket.

        Args:
            basket_id: Basket ID
            asset_type: Filter by asset type (brand_guideline, research_report, etc.)
            agent_scope: Filter by agent scope (research, content, etc.)
            user_jwt: Optional user JWT for auth

        Returns:
            List of reference asset metadata
        """
        url = f"{self.base_url}/api/substrate/baskets/{basket_id}/assets"
        params = {}
        if asset_type:
            params["asset_type"] = asset_type
        if agent_scope:
            params["agent_scope"] = agent_scope

        response = await self.client.get(url, params=params, headers=self._get_headers(user_jwt))
        response.raise_for_status()
        return response.json()

    async def close(self):
        """Close HTTP client."""
        await self.client.aclose()


# ============================================================================
# MCP Server
# ============================================================================


def create_mcp_server() -> Server:
    """
    Create MCP server with three tools for Claude Agent SDK.

    Returns:
        MCP Server instance with tools registered
    """
    server = Server("yarnnn-substrate-tools")

    # Initialize substrate client
    substrate_client = SubstrateClient(SUBSTRATE_API_URL, SUBSTRATE_SERVICE_SECRET)

    # ========================================================================
    # Tool 1: query_substrate
    # ========================================================================

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        """List available MCP tools."""
        return [
            Tool(
                name="query_substrate",
                description=(
                    "Search the knowledge substrate using semantic search. "
                    "Returns relevant blocks (facts, constraints, findings, etc.) "
                    "based on natural language query. Use this to understand existing "
                    "project context before doing research or creating outputs."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "basket_id": {
                            "type": "string",
                            "description": "Basket ID to search within (required)",
                        },
                        "query_text": {
                            "type": "string",
                            "description": "Natural language query describing what you're looking for",
                        },
                        "semantic_types": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by semantic types: fact, constraint, action, finding, issue, etc.",
                        },
                        "anchor_roles": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by anchor roles: problem, solution, context, etc.",
                        },
                        "states": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Filter by block states (default: ACCEPTED, LOCKED, CONSTANT)",
                        },
                        "min_similarity": {
                            "type": "number",
                            "description": "Minimum similarity score 0-1 (default: 0.70)",
                            "minimum": 0,
                            "maximum": 1,
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum results to return (default: 20)",
                            "minimum": 1,
                            "maximum": 100,
                        },
                        "user_jwt": {
                            "type": "string",
                            "description": "User JWT for auth (optional if service auth is enabled)",
                        },
                    },
                    "required": ["basket_id", "query_text"],
                },
            ),
            Tool(
                name="emit_work_output",
                description=(
                    "Create a work output deliverable for user supervision. "
                    "Use this to emit structured findings, recommendations, insights, "
                    "or draft content. All outputs go to pending_review status and "
                    "must be approved by the user before being absorbed into substrate."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "basket_id": {"type": "string", "description": "Basket ID"},
                        "work_ticket_id": {"type": "string", "description": "Work session ID"},
                        "output_type": {
                            "type": "string",
                            "enum": ["finding", "recommendation", "insight", "draft_content", "analysis"],
                            "description": "Type of work output",
                        },
                        "agent_type": {
                            "type": "string",
                            "enum": ["research", "content", "reporting", "analysis"],
                            "description": "Agent type that created this output",
                        },
                        "title": {
                            "type": "string",
                            "maxLength": 200,
                            "description": "Output title (max 200 chars)",
                        },
                        "body": {
                            "type": "object",
                            "properties": {
                                "summary": {"type": "string", "description": "Brief summary"},
                                "details": {"type": "string", "description": "Detailed explanation"},
                                "evidence": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Supporting evidence",
                                },
                                "recommendations": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "description": "Action recommendations",
                                },
                                "confidence_factors": {
                                    "type": "object",
                                    "description": "Factors affecting confidence",
                                },
                            },
                            "required": ["summary"],
                            "description": "Structured output body",
                        },
                        "confidence": {
                            "type": "number",
                            "minimum": 0,
                            "maximum": 1,
                            "description": "Confidence score 0-1",
                        },
                        "source_context_ids": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Block IDs used as sources (provenance)",
                        },
                        "tool_call_id": {
                            "type": "string",
                            "description": "Claude's tool_use id for traceability (optional)",
                        },
                        "metadata": {
                            "type": "object",
                            "description": "Additional metadata (optional)",
                        },
                        "user_jwt": {
                            "type": "string",
                            "description": "User JWT for auth (optional if service auth is enabled)",
                        },
                    },
                    "required": [
                        "basket_id",
                        "work_ticket_id",
                        "output_type",
                        "agent_type",
                        "title",
                        "body",
                        "confidence",
                        "source_context_ids",
                    ],
                },
            ),
            Tool(
                name="get_reference_assets",
                description=(
                    "List reference assets (files) for a basket. "
                    "Returns brand guidelines, research reports, product specs, etc. "
                    "Use this to access reference materials before creating outputs."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "basket_id": {"type": "string", "description": "Basket ID"},
                        "asset_type": {
                            "type": "string",
                            "description": "Filter by asset type: brand_guideline, research_report, product_spec, etc.",
                        },
                        "agent_scope": {
                            "type": "string",
                            "description": "Filter by agent scope: research, content, reporting, etc.",
                        },
                        "user_jwt": {
                            "type": "string",
                            "description": "User JWT for auth (optional if service auth is enabled)",
                        },
                    },
                    "required": ["basket_id"],
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        """Handle tool calls from Claude Agent SDK."""
        try:
            if name == "query_substrate":
                result = await substrate_client.query_substrate(
                    basket_id=arguments["basket_id"],
                    query_text=arguments["query_text"],
                    semantic_types=arguments.get("semantic_types"),
                    anchor_roles=arguments.get("anchor_roles"),
                    states=arguments.get("states"),
                    min_similarity=arguments.get("min_similarity", 0.70),
                    limit=arguments.get("limit", 20),
                    user_jwt=arguments.get("user_jwt"),
                )
                return [TextContent(type="text", text=str(result))]

            elif name == "emit_work_output":
                result = await substrate_client.emit_work_output(
                    basket_id=arguments["basket_id"],
                    work_ticket_id=arguments["work_ticket_id"],
                    output_type=arguments["output_type"],
                    agent_type=arguments["agent_type"],
                    title=arguments["title"],
                    body=arguments["body"],
                    confidence=arguments["confidence"],
                    source_context_ids=arguments["source_context_ids"],
                    tool_call_id=arguments.get("tool_call_id"),
                    metadata=arguments.get("metadata"),
                    user_jwt=arguments.get("user_jwt"),
                )
                return [TextContent(type="text", text=str(result))]

            elif name == "get_reference_assets":
                result = await substrate_client.get_reference_assets(
                    basket_id=arguments["basket_id"],
                    asset_type=arguments.get("asset_type"),
                    agent_scope=arguments.get("agent_scope"),
                    user_jwt=arguments.get("user_jwt"),
                )
                return [TextContent(type="text", text=str(result))]

            else:
                raise ValueError(f"Unknown tool: {name}")

        except httpx.HTTPStatusError as e:
            logger.error(f"Tool {name} failed with HTTP error: {e}")
            return [TextContent(type="text", text=f"Error: {e.response.status_code} - {e.response.text}")]
        except Exception as e:
            logger.error(f"Tool {name} failed: {e}")
            return [TextContent(type="text", text=f"Error: {str(e)}")]

    return server


# ============================================================================
# Main Entry Point
# ============================================================================


async def main():
    """Run MCP server via stdio."""
    server = create_mcp_server()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
