import httpx
import pytest

BASE_URL = "http://localhost:10000"  # Adjust as needed for test env

# Skip entire module if API server isn't reachable
try:
    httpx.get(BASE_URL, timeout=1)
except Exception:
    pytest.skip("API server not available", allow_module_level=True)


@pytest.mark.parametrize(
    "method, path",
    [
        ("POST", "/api/agent-run"),
        ("POST", "/api/agent"),
        ("POST", "/api/agent/direct"),
    ],
)
def test_api_route_exists(method, path):
    client = httpx.Client()
    response = client.request(method, f"{BASE_URL}{path}")
    assert response.status_code != 404, f"Route {method} {path} returned 404"
    assert response.status_code < 500, f"Route {method} {path} caused server error"
