"""
Work Output Tools - Tool definitions for structured agent outputs.

This module defines the emit_work_output tool that agents use to produce
structured work outputs. The tool schema forces Claude to emit structured
data that can be parsed and stored for user supervision.

Pattern:
1. Agent reasons about task
2. Agent calls emit_work_output tool with structured data
3. Response is parsed to extract WorkOutput objects
4. WorkOutputs are written to substrate-API via BFF
5. User reviews and approves/rejects in supervision UI

This is the critical bridge between Claude's reasoning and the work_outputs table.
"""

from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class WorkOutput:
    """
    Structured work output from agent execution.

    This corresponds to a row in the work_outputs table.
    Created by parsing Claude's tool_use response.
    """
    output_type: str  # finding, recommendation, insight, draft_content, etc.
    title: str
    body: Dict[str, Any]  # Structured content
    confidence: float
    source_block_ids: List[str] = None  # Provenance
    tool_call_id: str = None  # Claude's tool_use id

    def __post_init__(self):
        if self.source_block_ids is None:
            self.source_block_ids = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API serialization."""
        return {
            "output_type": self.output_type,
            "title": self.title,
            "body": self.body,
            "confidence": self.confidence,
            "source_context_ids": self.source_block_ids,
            "tool_call_id": self.tool_call_id,
        }


# Universal tool schema for emitting work outputs
# This is the Claude tool definition that agents include in their tool list
EMIT_WORK_OUTPUT_TOOL = {
    "name": "emit_work_output",
    "description": """Emit a structured work output for user review.

Use this tool to record your findings, recommendations, insights, or draft content.
Each output you emit will be reviewed by the user before any action is taken.

IMPORTANT: You MUST use this tool for EVERY significant finding or output you generate.
Do not just describe your findings in text - emit them as structured outputs.

When to use:
- You discover a new fact or finding (output_type: "finding")
- You want to suggest an action (output_type: "recommendation")
- You identify a pattern or insight (output_type: "insight")
- You draft content for review (output_type: "draft_content")
- You analyze data (output_type: "data_analysis")
- You create a report section (output_type: "report_section")
""",
    "input_schema": {
        "type": "object",
        "properties": {
            "output_type": {
                "type": "string",
                "enum": [
                    "finding",
                    "recommendation",
                    "insight",
                    "draft_content",
                    "report_section",
                    "data_analysis"
                ],
                "description": "Type of work output. Use 'finding' for facts, 'recommendation' for actions, 'insight' for patterns, 'draft_content' for content drafts."
            },
            "title": {
                "type": "string",
                "description": "Concise title for this output (max 200 chars). Should be descriptive and actionable.",
                "maxLength": 200
            },
            "body": {
                "type": "object",
                "description": "Structured content of the output. Must include 'summary' at minimum.",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Brief summary of the output (1-3 sentences)"
                    },
                    "details": {
                        "type": "string",
                        "description": "Detailed explanation or full content"
                    },
                    "evidence": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of evidence or sources supporting this output"
                    },
                    "recommendations": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Actionable next steps or suggestions"
                    },
                    "data": {
                        "type": "object",
                        "description": "Structured data (for data_analysis outputs)"
                    },
                    "platform": {
                        "type": "string",
                        "description": "Target platform (for draft_content outputs)"
                    },
                    "draft_text": {
                        "type": "string",
                        "description": "The actual draft content (for draft_content outputs)"
                    }
                },
                "required": ["summary"]
            },
            "confidence": {
                "type": "number",
                "minimum": 0,
                "maximum": 1,
                "description": "Confidence score (0.0 to 1.0). Use 0.9+ for verified facts, 0.7-0.9 for likely facts, 0.5-0.7 for uncertain, below 0.5 for speculative."
            },
            "source_block_ids": {
                "type": "array",
                "items": {"type": "string"},
                "description": "IDs of context blocks used to generate this output (for provenance tracking)"
            }
        },
        "required": ["output_type", "title", "body", "confidence"]
    }
}


def parse_work_outputs_from_response(response: Any) -> List[WorkOutput]:
    """
    Parse Claude response to extract structured work outputs.

    This function examines Claude's response for tool_use blocks that
    call the emit_work_output tool. Each valid tool call becomes a WorkOutput.

    Args:
        response: Claude API response (anthropic.types.Message)

    Returns:
        List of WorkOutput objects

    Example:
        response = await client.messages.create(
            model="claude-sonnet-4-5",
            tools=[EMIT_WORK_OUTPUT_TOOL],
            messages=[...]
        )
        outputs = parse_work_outputs_from_response(response)
        # outputs is List[WorkOutput]
    """
    outputs = []

    # Handle dict response (from raw JSON)
    if isinstance(response, dict):
        content_blocks = response.get("content", [])
    # Handle Message object (from Anthropic SDK)
    elif hasattr(response, "content"):
        content_blocks = response.content
    else:
        logger.warning(f"Unexpected response type: {type(response)}")
        return outputs

    for block in content_blocks:
        # Handle both dict and object representations
        if isinstance(block, dict):
            block_type = block.get("type")
            tool_name = block.get("name")
            tool_input = block.get("input", {})
            tool_id = block.get("id")
        else:
            block_type = getattr(block, "type", None)
            tool_name = getattr(block, "name", None)
            tool_input = getattr(block, "input", {})
            tool_id = getattr(block, "id", None)

        # Only process emit_work_output tool calls
        if block_type == "tool_use" and tool_name == "emit_work_output":
            try:
                output = WorkOutput(
                    output_type=tool_input.get("output_type", "insight"),
                    title=tool_input.get("title", "Untitled Output"),
                    body=tool_input.get("body", {"summary": "No summary provided"}),
                    confidence=tool_input.get("confidence", 0.5),
                    source_block_ids=tool_input.get("source_block_ids", []),
                    tool_call_id=tool_id
                )
                outputs.append(output)
                logger.debug(f"Parsed work output: {output.title} ({output.output_type})")
            except Exception as e:
                logger.error(f"Failed to parse work output from tool call: {e}")
                continue

    logger.info(f"Parsed {len(outputs)} work outputs from Claude response")
    return outputs


def validate_work_output(output: WorkOutput) -> List[str]:
    """
    Validate work output structure and content.

    Returns list of validation errors (empty if valid).
    """
    errors = []

    # Required fields
    if not output.output_type:
        errors.append("output_type is required")

    if not output.title or len(output.title.strip()) == 0:
        errors.append("title is required and cannot be empty")

    if len(output.title) > 200:
        errors.append("title must be 200 characters or less")

    if not isinstance(output.body, dict):
        errors.append("body must be a dictionary")
    elif "summary" not in output.body:
        errors.append("body must contain 'summary' field")

    if output.confidence is None:
        errors.append("confidence is required")
    elif not (0 <= output.confidence <= 1):
        errors.append("confidence must be between 0 and 1")

    # Type-specific validation
    valid_types = ["finding", "recommendation", "insight", "draft_content", "report_section", "data_analysis"]
    if output.output_type not in valid_types:
        errors.append(f"output_type must be one of: {valid_types}")

    # Draft content specific
    if output.output_type == "draft_content":
        if "draft_text" not in output.body:
            errors.append("draft_content outputs must include 'draft_text' in body")

    return errors


def create_tool_result(tool_use_id: str, success: bool = True, error: str = None) -> dict:
    """
    Create a tool result to send back to Claude.

    When using tools in multi-turn conversations, Claude expects a tool result
    for each tool call. This helper creates the proper format.

    Args:
        tool_use_id: The id from Claude's tool_use block
        success: Whether the tool call succeeded
        error: Error message if not successful

    Returns:
        Tool result dictionary for Claude API
    """
    if success:
        return {
            "type": "tool_result",
            "tool_use_id": tool_use_id,
            "content": "Work output recorded successfully. Continue with your analysis."
        }
    else:
        return {
            "type": "tool_result",
            "tool_use_id": tool_use_id,
            "content": f"Failed to record work output: {error}",
            "is_error": True
        }
