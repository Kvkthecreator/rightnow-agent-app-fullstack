"""
Module: agent_tasks.tools.common

Provides shared instances of external tools used by agents.
"""
import os

from .calendar import CalendarTool
from .data_fetch import DataFetchTool
from .web_search import Client as WebSearchTool

# Read configuration from environment variables
_CALENDAR_API_KEY = os.getenv("CALENDAR_API_KEY", "")
_DATA_FETCH_ENDPOINT = os.getenv("DATA_FETCH_ENDPOINT", "")

# Shared tool instances
calendar = CalendarTool(api_key=_CALENDAR_API_KEY)
data_fetch = DataFetchTool(endpoint=_DATA_FETCH_ENDPOINT)
# Web search tool instance (stub)
web_search = WebSearchTool()

__all__ = ["calendar", "data_fetch", "web_search"]