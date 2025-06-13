from abc import ABC, abstractmethod
from typing import Any, Dict


class Tool(ABC):
    slug: str  # e.g. "mcp" or "web_search"

    @abstractmethod
    async def run(self, *args, **kwargs) -> Dict[str, Any]:
        """Execute the tool.  Return structured JSON."""
