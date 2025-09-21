"""
LLM Service – OpenAI Responses API provider for YARNNN agents

Decision background (documented for future maintainers):
- We run both P1 (substrate extraction) and P4 (composition) on OpenAI to keep consistency.
- For P1 we already use OpenAI structured outputs. For P4 we replace prior Anthropic usage
  with OpenAI Responses/Chat Completions and JSON schema enforcement for planning steps.
- Models are configurable. If a bleeding-edge model (e.g., "gpt-5") is available in the
  account/region, we will use it; otherwise we gracefully fall back to strong defaults
  (o4/o4-mini). We also perform a runtime model-availability check and log the fallback.

This file provides a minimal provider interface and an OpenAI-backed implementation used
by agents. Keep Canon boundaries: providers never bypass pipeline rules.
"""

from dataclasses import dataclass
import json
import logging
import os
from typing import Any, Dict, Optional

from openai import OpenAI

logger = logging.getLogger("uvicorn.error")


@dataclass
class LLMResponse:
    """Standardized LLM response container."""
    success: bool
    content: str
    parsed: Optional[Dict[str, Any]] = None
    usage: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class LLMProvider:
    """Abstract provider interface (minimal for our needs)."""

    async def get_json_response(
        self,
        prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4000,
        schema_name: Optional[str] = None,
    ) -> LLMResponse:  # pragma: no cover - interface only
        raise NotImplementedError

    async def get_text_response(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> LLMResponse:  # pragma: no cover - interface only
        raise NotImplementedError


def _p3_schema(name: str) -> Optional[Dict[str, Any]]:
    """JSON Schemas for P3 reflection outputs."""
    if name == "p3_reflection":
        return {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "patterns": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "description": {"type": "string"},
                            "evidence_ids": {"type": "array", "items": {"type": "string"}},
                            "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                        },
                        "required": ["type", "description"],
                        "additionalProperties": True
                    }
                },
                "tensions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "evidence_ids": {"type": "array", "items": {"type": "string"}},
                            "severity": {"type": "string"}
                        },
                        "required": ["description"],
                        "additionalProperties": True
                    }
                },
                "opportunities": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "suggested_action": {"type": "string"}
                        },
                        "required": ["description"],
                        "additionalProperties": True
                    }
                },
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "priority": {"type": "string"}
                        },
                        "required": ["description"],
                        "additionalProperties": True
                    }
                },
                "recommendations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string"},
                            "rationale": {"type": "string"}
                        },
                        "required": ["description"],
                        "additionalProperties": True
                    }
                },
                "confidence_overall": {"type": "number", "minimum": 0, "maximum": 1},
                "window_start": {"type": "string"},
                "window_end": {"type": "string"},
                "substrate_hash": {"type": "string"}
            },
            "required": ["summary"],
            "additionalProperties": True
        }
    return None


def _p4_schema(name: str) -> Optional[Dict[str, Any]]:
    """Built-in JSON Schemas used by P4 planning steps.

    Keeping schemas here preserves separation of concerns without inflating agent code.
    """
    if name == "p4_intent_strategy":
        return {
            "type": "object",
            "properties": {
                "document_type": {"type": "string"},
                "key_themes": {"type": "array", "items": {"type": "string"}},
                "substrate_priorities": {
                    "type": "object",
                    "properties": {
                        "blocks": {"type": "boolean"},
                        "dumps": {"type": "boolean"},
                        "context_items": {"type": "boolean"},
                        "relationships": {"type": "boolean"},
                    },
                    "required": ["blocks", "dumps", "context_items", "relationships"],
                    "additionalProperties": False,
                },
                "organization": {"type": "string"},
                "tone": {"type": "string"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "original_intent": {"type": "string"},
            },
            "required": [
                "document_type",
                "key_themes",
                "substrate_priorities",
                "organization",
                "tone",
                "confidence",
                "original_intent",
            ],
            "additionalProperties": False,
        }
    if name == "p4_scoring_selection":
        return {
            "type": "object",
            "properties": {
                "selected_indices": {
                    "type": "array",
                    "items": {"type": "integer", "minimum": 0},
                },
                "reasoning": {"type": "string"},
                "groupings": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "indices": {
                                "type": "array",
                                "items": {"type": "integer", "minimum": 0},
                            },
                        },
                        "required": ["name", "indices"],
                        "additionalProperties": False,
                    },
                },
                "coverage_assessment": {"type": "string"},
            },
            "required": ["selected_indices", "reasoning"],
            "additionalProperties": False,
        }
    if name == "p4_narrative_structure":
        return {
            "type": "object",
            "properties": {
                "sections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "content": {"type": "string"},
                            "substrate_refs": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                            "order": {"type": "integer"},
                        },
                        "required": ["title", "content", "order"],
                        "additionalProperties": True,
                    },
                },
                "introduction": {"type": "string"},
                "summary": {"type": "string"},
                "composition_notes": {"type": "string"},
            },
            "required": ["sections", "summary"],
            "additionalProperties": True,
        }
    return None


class OpenAIProvider(LLMProvider):
    """OpenAI-backed provider using Chat Completions (with JSON schema) for now.

    Notes:
    - We validate model availability at init; if unavailable, fallback to o4-mini.
    - We use chat.completions with response_format json_schema (aligned with P1 usage).
      We can migrate to Responses API seamlessly later with identical interface.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set")

        self.client = OpenAI(api_key=api_key)

        # Model configuration with graceful fallback
        desired_json_model = os.getenv("OPENAI_MODEL_P4_JSON", os.getenv("LLM_MODEL_P4_JSON", "gpt-5"))
        desired_text_model = os.getenv("OPENAI_MODEL_P4_TEXT", os.getenv("LLM_MODEL_P4_TEXT", "gpt-5"))

        self.json_model = self._first_available_model(
            desired_json_model, fallbacks=["o4-mini", "gpt-4o-mini"]
        )
        self.text_model = self._first_available_model(
            desired_text_model, fallbacks=["o4", "o4-mini", "gpt-4o"]
        )

        logger.info(
            f"OpenAIProvider initialized (json_model={self.json_model}, text_model={self.text_model})"
        )

    def _is_model_available(self, model: str) -> bool:
        try:
            # Lightweight check – server-side; will fail fast if model is unknown
            self.client.models.retrieve(model)
            return True
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Model not available: {model} (reason: {e})")
            return False

    def _first_available_model(self, preferred: str, fallbacks: list[str]) -> str:
        if preferred and self._is_model_available(preferred):
            return preferred
        for m in fallbacks:
            if self._is_model_available(m):
                logger.info(f"Using fallback model: {m}")
                return m
        # Last resort: return the preferred string; the API will error and surface in logs
        logger.error(
            f"No fallback model available; proceeding with preferred '{preferred}' (may fail at runtime)"
        )
        return preferred

    def _schema_wrapper(self, name: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "type": "json_schema",
            "json_schema": {
                "name": name,
                "schema": schema,
                "strict": True,
            },
        }

    async def get_json_response(
        self,
        prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 4000,
        schema_name: Optional[str] = None,
    ) -> LLMResponse:
        try:
            response_format = None
            if schema_name:
                schema = _p4_schema(schema_name)
                if schema is None:
                    schema = _p3_schema(schema_name)
                if schema is not None:
                    response_format = self._schema_wrapper(schema_name, schema)

            # Build request parameters
            request_params = {
                "model": self.json_model,
                "messages": [
                    {"role": "system", "content": "Respond ONLY with valid JSON per schema when provided."},
                    {"role": "user", "content": prompt},
                ],
                "response_format": response_format,
                "max_completion_tokens": max_tokens,
            }
            
            # Only add temperature if it's different from default (1.0)
            # Some models don't support custom temperature values
            if temperature != 1.0:
                request_params["temperature"] = temperature
            
            resp = self.client.chat.completions.create(**request_params)

            raw = resp.choices[0].message.content or ""
            parsed: Optional[Dict[str, Any]] = None
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # If the model didn't adhere strictly, try to extract JSON body
                import re

                m = re.search(r"\{[\s\S]*\}", raw)
                if m:
                    parsed = json.loads(m.group(0))

            return LLMResponse(
                success=parsed is not None,
                content=raw,
                parsed=parsed,
                usage={
                    "input_tokens": getattr(getattr(resp, "usage", None), "prompt_tokens", 0),
                    "output_tokens": getattr(getattr(resp, "usage", None), "completion_tokens", 0),
                },
                error=None if parsed is not None else "Invalid JSON response",
            )
        except Exception as e:  # noqa: BLE001
            logger.error(f"OpenAI JSON call failed: {e}")
            return LLMResponse(success=False, content="", parsed=None, usage=None, error=str(e))

    async def get_text_response(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> LLMResponse:
        try:
            # Build request parameters
            request_params = {
                "model": self.text_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_completion_tokens": max_tokens,
            }
            
            # Only add temperature if it's different from default (1.0)
            # Some models don't support custom temperature values
            if temperature != 1.0:
                request_params["temperature"] = temperature
                
            resp = self.client.chat.completions.create(**request_params)
            content = resp.choices[0].message.content or ""
            return LLMResponse(
                success=True,
                content=content,
                parsed=None,
                usage={
                    "input_tokens": getattr(getattr(resp, "usage", None), "prompt_tokens", 0),
                    "output_tokens": getattr(getattr(resp, "usage", None), "completion_tokens", 0),
                },
            )
        except Exception as e:  # noqa: BLE001
            logger.error(f"OpenAI text call failed: {e}")
            return LLMResponse(success=False, content="", parsed=None, usage=None, error=str(e))


# Global singleton access -------------------------------------------------

_llm_singleton: Optional[LLMProvider] = None


def get_llm() -> LLMProvider:
    """Get global LLM provider instance.

    Currently returns the OpenAI provider. We keep a minimal seam for future
    provider swaps while maintaining Canon purity and consistent behavior.
    """
    global _llm_singleton
    if _llm_singleton is None:
        _llm_singleton = OpenAIProvider()
    return _llm_singleton
