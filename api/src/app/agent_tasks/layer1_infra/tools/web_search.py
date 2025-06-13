from typing import Any, Dict, List

from .base import Tool


class Client(Tool):
    slug = "web_search"

    async def run(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Hit a real search API (placeholder implementation).
        Returns list of {title, url, snippet}.
        """
        # TODO: plug real API key / endpoint.
        # This stub returns dummy search results.
        results: List[Dict[str, Any]] = [
            {"title": f"Result {i}", "url": f"https://example.com/{i}", "snippet": "..."}
            for i in range(1, num_results + 1)
        ]
        return {"results": results}
