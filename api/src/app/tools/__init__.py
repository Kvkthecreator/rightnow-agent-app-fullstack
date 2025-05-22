"""Tool registry & factory helpers"""
from typing import List
from .base import Tool
from importlib import import_module

# Mapping slug -> module path (initially only MCP; others added later)
_TOOL_MODULES = {
    "mcp": ".mcp",
    "web_search": ".web_search",
    "image_gen": ".image_gen",
    # add future tools here
}

def _load(slug: str) -> Tool:
    module_path = _TOOL_MODULES[slug]
    mod = import_module(__name__ + module_path)
    return mod.Client()  # all tool modules expose Client subclassing Tool

def get_tool_clients(slugs: List[str]) -> List[Tool]:
    return [_load(s) for s in slugs]