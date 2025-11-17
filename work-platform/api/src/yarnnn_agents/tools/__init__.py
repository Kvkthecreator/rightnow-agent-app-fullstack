"""
YARNNN Agent Tools - Structured output and substrate interaction tools.

This module provides Claude tool definitions that enable agents to emit
structured work outputs for user supervision.

Key Pattern:
- Agents MUST use emit_work_output tool to produce structured outputs
- Tool-use forces structured data instead of free-form text
- Outputs are parsed and stored in work_outputs table for supervision
"""

from .work_output_tools import (
    EMIT_WORK_OUTPUT_TOOL,
    parse_work_outputs_from_response,
    WorkOutput,
)

__all__ = [
    "EMIT_WORK_OUTPUT_TOOL",
    "parse_work_outputs_from_response",
    "WorkOutput",
]
