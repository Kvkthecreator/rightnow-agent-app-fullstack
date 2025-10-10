from __future__ import annotations

"""Embedding service utilities.

YARNNN currently standardises on OpenAI embeddings so that basket signatures
and session fingerprints are comparable across adapters.  The helpers below
wrap the OpenAI client and provide a lightweight cache so callers do not need
to manage client lifecycle themselves.
"""

import logging
import os
from functools import lru_cache
from typing import List, Optional

from openai import OpenAI

logger = logging.getLogger("uvicorn.error")


class EmbeddingService:
    """Thin wrapper around the OpenAI embeddings endpoint."""

    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")

        self.client = OpenAI(api_key=api_key)
        self.model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-large")

    def embed(self, text: str) -> List[float]:
        if not text.strip():
            raise ValueError("Cannot embed empty text")

        # OpenAI embeddings expect <= 8192 tokens; guard with a hard character cap.
        trimmed = text[:8000]
        response = self.client.embeddings.create(
            model=self.model,
            input=trimmed,
        )
        return list(response.data[0].embedding)


@lru_cache(maxsize=1)
def get_embedding_service() -> EmbeddingService:
    """Return a cached embedding service instance."""

    return EmbeddingService()


def generate_embedding(text: str) -> Optional[List[float]]:
    """Safely generate an embedding for the supplied text.

    Any upstream OpenAI errors are logged and surfaced as ``None`` so callers can
    gracefully continue without breaking primary flows.
    """

    if not text or not text.strip():
        return None

    try:
        service = get_embedding_service()
        return service.embed(text)
    except Exception as exc:  # noqa: BLE001
        logger.error("Embedding generation failed: %s", exc)
        return None
