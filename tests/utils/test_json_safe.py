import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from utils.db import json_safe  # noqa: E402


def test_json_safe_converts_datetime():
    safe = json_safe({"foo": "bar", "when": datetime(2025, 6, 11, 12, 0, 0)})
    assert safe["when"].startswith("2025-06-11T12:00:00")


def test_json_safe_drops_none():
    safe = json_safe({"a": None, "b": 1})
    assert "a" not in safe and safe["b"] == 1
