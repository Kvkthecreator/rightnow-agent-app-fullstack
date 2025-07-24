import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from app.utils.event_log import log_event  # noqa: E402


def test_log_event_returns_none():
    assert log_event("doc_scaffold_finished", {"basket_id": "123"}) is None
