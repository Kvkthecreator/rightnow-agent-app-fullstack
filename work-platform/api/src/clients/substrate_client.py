"""
HTTP client for Substrate API service-to-service communication.

Phase 3.1: BFF Foundation - HTTP client with:
- Service token authentication
- Retry logic with exponential backoff
- Circuit breaker for fault tolerance
- Request/response logging
- Connection pooling
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Optional
from uuid import UUID

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

logger = logging.getLogger("uvicorn.error")


class SubstrateAPIError(Exception):
    """Base exception for Substrate API errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        details: Optional[dict] = None,
        retry_after: Optional[int] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.retry_after = retry_after
        super().__init__(message)

    def is_retryable(self) -> bool:
        """Check if this error should trigger a retry."""
        # Retry on 5xx errors and specific 4xx errors
        if self.status_code:
            return self.status_code >= 500 or self.status_code in [408, 429]
        return False


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascading failures.

    - CLOSED: Normal operation
    - OPEN: Too many failures, reject all requests for cooldown period
    - HALF_OPEN: Testing if service recovered, allow limited requests
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        cooldown_seconds: int = 60,
        half_open_max_requests: int = 3,
    ):
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.half_open_max_requests = half_open_max_requests

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_requests = 0

    def record_success(self):
        """Record successful request."""
        if self.state == CircuitState.HALF_OPEN:
            # Success in half-open state -> close circuit
            logger.info("Circuit breaker: Service recovered, closing circuit")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.half_open_requests = 0
        elif self.state == CircuitState.CLOSED:
            # Reset failure count on success
            self.failure_count = 0

    def record_failure(self):
        """Record failed request."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.state == CircuitState.HALF_OPEN:
            # Failure in half-open state -> reopen circuit
            logger.warning("Circuit breaker: Service still failing, reopening circuit")
            self.state = CircuitState.OPEN
            self.half_open_requests = 0
        elif self.state == CircuitState.CLOSED:
            if self.failure_count >= self.failure_threshold:
                logger.error(
                    f"Circuit breaker: Opening circuit after {self.failure_count} failures"
                )
                self.state = CircuitState.OPEN

    def can_request(self) -> bool:
        """Check if requests are allowed."""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if cooldown period passed
            if (
                self.last_failure_time
                and (datetime.utcnow() - self.last_failure_time).total_seconds()
                >= self.cooldown_seconds
            ):
                logger.info("Circuit breaker: Cooldown passed, entering half-open state")
                self.state = CircuitState.HALF_OPEN
                self.half_open_requests = 0
                return True
            return False

        if self.state == CircuitState.HALF_OPEN:
            # Allow limited requests in half-open state
            if self.half_open_requests < self.half_open_max_requests:
                self.half_open_requests += 1
                return True
            return False

        return False


class SubstrateClient:
    """
    HTTP client for Substrate API with resilience patterns.

    Features:
    - Service token authentication
    - Automatic retries with exponential backoff
    - Circuit breaker for fault tolerance
    - Connection pooling via httpx.Client
    - Request/response logging
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        service_secret: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.base_url = base_url or os.getenv(
            "SUBSTRATE_API_URL", "http://localhost:10000"
        )
        self.service_secret = service_secret or os.getenv("SUBSTRATE_SERVICE_SECRET")
        self.timeout = timeout

        if not self.service_secret:
            logger.warning(
                "SUBSTRATE_SERVICE_SECRET not set - service auth will fail"
            )

        # HTTP client with connection pooling
        self.client = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout,
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=100),
        )

        # Circuit breaker for fault tolerance
        self.circuit_breaker = CircuitBreaker()

        logger.info(f"SubstrateClient initialized with base_url={self.base_url}")

    def _get_headers(self) -> dict[str, str]:
        """Get request headers with service authentication."""
        return {
            "Authorization": f"Bearer {self.service_secret}",
            "X-Service-Name": "platform-api",
            "Content-Type": "application/json",
        }

    def _handle_response(self, response: httpx.Response) -> dict:
        """Handle HTTP response and raise appropriate errors."""
        # Log request/response for debugging
        logger.debug(
            f"Substrate API {response.request.method} {response.request.url}: {response.status_code}"
        )

        if response.status_code >= 400:
            error_detail = response.json() if response.text else {}
            error_message = error_detail.get(
                "detail", f"HTTP {response.status_code} error"
            )

            raise SubstrateAPIError(
                message=error_message,
                status_code=response.status_code,
                details=error_detail,
            )

        return response.json() if response.text else {}

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(SubstrateAPIError),
        reraise=True,
    )
    def _request(
        self,
        method: str,
        endpoint: str,
        json: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """
        Make HTTP request with retry logic and circuit breaker.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path (e.g., "/api/health")
            json: Request body (for POST/PUT)
            params: Query parameters

        Returns:
            Response JSON

        Raises:
            SubstrateAPIError: On HTTP errors or circuit open
        """
        # Check circuit breaker
        if not self.circuit_breaker.can_request():
            raise SubstrateAPIError(
                message="Substrate API circuit breaker is OPEN - service unavailable",
                status_code=503,
            )

        start_time = time.time()

        try:
            response = self.client.request(
                method=method,
                url=endpoint,
                json=json,
                params=params,
                headers=self._get_headers(),
            )

            result = self._handle_response(response)
            self.circuit_breaker.record_success()

            latency_ms = (time.time() - start_time) * 1000
            logger.debug(f"Substrate API call succeeded in {latency_ms:.2f}ms")

            return result

        except SubstrateAPIError as e:
            self.circuit_breaker.record_failure()
            logger.error(
                f"Substrate API error: {e.message}",
                extra={
                    "status_code": e.status_code,
                    "endpoint": endpoint,
                    "details": e.details,
                },
            )
            # Only retry if error is retryable
            if not e.is_retryable():
                raise
            raise

        except Exception as e:
            self.circuit_breaker.record_failure()
            logger.exception(f"Substrate API request failed: {e}")
            raise SubstrateAPIError(
                message=f"Request failed: {str(e)}",
                details={"exception": str(e)},
            )

    # ========================================================================
    # Health & Status
    # ========================================================================

    def health_check(self) -> dict:
        """
        Check Substrate API health.

        Returns:
            {"status": "ok"} or raises SubstrateAPIError
        """
        return self._request("GET", "/health")

    def work_queue_health(self) -> dict:
        """
        Get work queue health metrics.

        Returns:
            Queue health statistics
        """
        return self._request("GET", "/api/work/health")

    # ========================================================================
    # Block Operations (Read-Only)
    # ========================================================================

    def get_basket_blocks(
        self,
        basket_id: UUID | str,
        states: Optional[list[str]] = None,
        limit: Optional[int] = None,
    ) -> list[dict]:
        """
        Get all blocks for a basket.

        Args:
            basket_id: Basket UUID
            states: Filter by block states (e.g., ["ACCEPTED", "LOCKED"])
            limit: Maximum number of blocks to return

        Returns:
            List of block dictionaries
        """
        params = {}
        if states:
            params["states"] = ",".join(states)
        if limit:
            params["limit"] = limit

        response = self._request("GET", f"/baskets/{basket_id}/blocks", params=params)
        return response.get("blocks", [])

    # ========================================================================
    # Work Orchestration (Canon v2.1)
    # ========================================================================

    def initiate_work(
        self,
        basket_id: UUID | str,
        work_mode: str,
        payload: dict,
        user_id: Optional[UUID | str] = None,
    ) -> dict:
        """
        Initiate new substrate work via Universal Work Orchestration.

        Args:
            basket_id: Basket UUID
            work_mode: Work mode (e.g., "compose_canon", "infer_relationships")
            payload: Work-specific payload
            user_id: Optional user ID for attribution

        Returns:
            {"work_id": "...", "status": "pending", ...}
        """
        request_body = {
            "basket_id": str(basket_id),
            "work_mode": work_mode,
            "payload": payload,
        }
        if user_id:
            request_body["user_id"] = str(user_id)

        return self._request("POST", "/api/work/initiate", json=request_body)

    def get_work_status(self, work_id: UUID | str) -> dict:
        """
        Get status of a work item.

        Args:
            work_id: Work UUID

        Returns:
            Work status details
        """
        return self._request("GET", f"/api/work/{work_id}/status")

    def retry_work(self, work_id: UUID | str) -> dict:
        """
        Retry failed work.

        Args:
            work_id: Work UUID

        Returns:
            Updated work status
        """
        return self._request("POST", f"/api/work/{work_id}/retry")

    # ========================================================================
    # Document Operations
    # ========================================================================

    def compose_document(
        self,
        basket_id: UUID | str,
        context_blocks: list[UUID | str],
        composition_intent: Optional[str] = None,
    ) -> dict:
        """
        Compose document from context blocks.

        Args:
            basket_id: Basket UUID
            context_blocks: List of block IDs to include
            composition_intent: Optional composition intent

        Returns:
            Document creation result
        """
        request_body = {
            "basket_id": str(basket_id),
            "context_block_ids": [str(block_id) for block_id in context_blocks],
        }
        if composition_intent:
            request_body["composition_intent"] = composition_intent

        return self._request(
            "POST", "/api/documents/compose-contextual", json=request_body
        )

    # ========================================================================
    # Basket Operations (Phase 6: Onboarding Scaffolding)
    # ========================================================================

    def create_basket(
        self,
        workspace_id: UUID | str,
        name: str,
        metadata: Optional[dict] = None,
        user_id: Optional[UUID | str] = None,
    ) -> dict:
        """
        Create new basket in substrate-api.

        Phase 6: Used by onboarding scaffolder to create context containers.

        Args:
            workspace_id: Workspace UUID
            name: Basket name
            metadata: Optional metadata (tags, origin_template, etc.)
            user_id: Optional user ID for ownership

        Returns:
            {"basket_id": "...", "name": "...", "workspace_id": "...", ...}
        """
        request_body = {
            "workspace_id": str(workspace_id),
            "name": name,
            "metadata": metadata or {},
        }
        if user_id:
            request_body["user_id"] = str(user_id)

        return self._request("POST", "/api/baskets", json=request_body)

    def get_basket_info(self, basket_id: UUID | str) -> dict:
        """
        Get basket information.

        Args:
            basket_id: Basket UUID

        Returns:
            Basket details
        """
        return self._request("GET", f"/api/baskets/{basket_id}")

    # ========================================================================
    # Raw Dumps / Inputs
    # ========================================================================

    def get_basket_inputs(self, basket_id: UUID | str) -> list[dict]:
        """
        Get all raw text dumps (inputs) for a basket.

        Args:
            basket_id: Basket UUID

        Returns:
            List of dump dictionaries
        """
        response = self._request("GET", f"/baskets/{basket_id}/inputs")
        return response.get("inputs", [])

    def create_dump(
        self,
        basket_id: UUID | str,
        content: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Create new raw dump (idempotent via content hash).

        Args:
            basket_id: Basket UUID
            content: Raw text content
            metadata: Optional metadata

        Returns:
            Dump creation result
        """
        import uuid

        # Generate deterministic UUID from content for idempotency
        # Using uuid5 with NAMESPACE_DNS ensures same content -> same UUID
        dump_request_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, content))

        request_body = {
            "basket_id": str(basket_id),
            "dump_request_id": dump_request_id,
            "text_dump": content,  # Changed from "content" to "text_dump"
            "meta": metadata or {},  # Changed from "metadata" to "meta"
        }
        return self._request("POST", "/api/dumps/new", json=request_body)

    # ========================================================================
    # Insights & Reflections (P3)
    # ========================================================================

    def generate_insight_canon(
        self,
        basket_id: UUID | str,
        force_regenerate: bool = False,
    ) -> dict:
        """
        Generate P3 insight canon for basket.

        Args:
            basket_id: Basket UUID
            force_regenerate: Force regeneration even if cached

        Returns:
            Insight artifact
        """
        request_body = {
            "basket_id": str(basket_id),
            "force_regenerate": force_regenerate,
        }
        return self._request("POST", "/p3/insight-canon", json=request_body)

    # ========================================================================
    # Phase 4: Additional Methods for Agent SDK Integration
    # ========================================================================

    def get_basket_documents(self, basket_id: UUID | str) -> list[dict]:
        """
        Get all documents for a basket.

        Args:
            basket_id: Basket UUID

        Returns:
            List of document dictionaries
        """
        response = self._request(
            "GET",
            f"/api/documents",
            params={"basket_id": str(basket_id)}
        )
        return response.get("documents", [])

    def get_basket_relationships(self, basket_id: UUID | str) -> list[dict]:
        """
        Get substrate relationships for a basket.

        Args:
            basket_id: Basket UUID

        Returns:
            List of relationship dictionaries
        """
        response = self._request(
            "GET",
            f"/api/baskets/{basket_id}/relationships"
        )
        return response.get("relationships", [])

    def search_semantic(
        self,
        basket_id: UUID | str,
        query: str,
        limit: int = 20
    ) -> list[dict]:
        """
        Semantic search across basket blocks.

        Note: This endpoint may not exist yet in substrate-api.
        For now, falls back to get_basket_blocks() with client-side filtering.

        Args:
            basket_id: Basket UUID
            query: Semantic query string
            limit: Maximum results to return

        Returns:
            List of matching block dictionaries
        """
        try:
            response = self._request(
                "POST",
                f"/api/baskets/{basket_id}/search",
                json={"query": query, "limit": limit}
            )
            return response.get("results", [])
        except SubstrateAPIError as e:
            # If endpoint doesn't exist (404), fall back to get_basket_blocks
            if e.status_code == 404:
                logger.warning(
                    "Semantic search endpoint not found, falling back to get_basket_blocks"
                )
                return self.get_basket_blocks(basket_id, limit=limit)
            raise

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - close HTTP client."""
        self.client.close()


# Global singleton instance
_substrate_client: Optional[SubstrateClient] = None


def get_substrate_client() -> SubstrateClient:
    """
    Get singleton SubstrateClient instance.

    Returns:
        SubstrateClient instance
    """
    global _substrate_client
    if _substrate_client is None:
        _substrate_client = SubstrateClient()
    return _substrate_client


# Convenience functions
health_check = lambda: get_substrate_client().health_check()
get_basket_blocks = lambda basket_id, **kwargs: get_substrate_client().get_basket_blocks(
    basket_id, **kwargs
)
initiate_work = lambda **kwargs: get_substrate_client().initiate_work(**kwargs)
