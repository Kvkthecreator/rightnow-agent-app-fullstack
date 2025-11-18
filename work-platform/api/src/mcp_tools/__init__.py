"""
MCP Tools for Claude Agent SDK Integration (Phase 1).

This module provides the bridge layer between Claude Agent SDK and YARNNN substrate-API.
These tools expose substrate-API capabilities (semantic search, work outputs, reference assets)
as MCP tools that Claude agents can invoke.

Architecture:
- MCP tools run in work-platform (orchestrator)
- Tools make HTTP requests to substrate-API (data owner)
- Auth: Service-to-service tokens + user JWT forwarding
- Pattern: BFF (Backend for Frontend)

Tools:
1. query_substrate: Semantic search across knowledge substrate
2. emit_work_output: Create work output deliverables for user supervision
3. get_reference_assets: Fetch files from Supabase Storage

Phase 1 Scope:
- Tools work independently (NO agent integration yet)
- Test scripts validate HTTP communication
- Auth validation (service token + user JWT)

See: docs/architecture/CLAUDE_AGENT_SDK_IMPLEMENTATION_PLAN.md Phase 1
"""

from .server import create_mcp_server

__all__ = ["create_mcp_server"]
