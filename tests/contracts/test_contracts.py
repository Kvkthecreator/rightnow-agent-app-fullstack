import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from schemas.audit import AuditIn
from schemas.basket_composer import BasketComposerIn
from schemas.block_diff import BlockDiffIn
from schemas.block_manager import BlockManagerIn
from schemas.config import ConfigIn
from schemas.context_block import ContextBlock
from schemas.dump_parser import DumpParserIn
from schemas.research import ResearchIn
from schemas.usage import UsageIn

from app.agent_tasks.layer2_tasks.schemas import ComposeRequest


def test_round_trip_dump_parser():
    payload = {"basket_id": "a" * 32, "artifacts": [], "user_id": "u"}
    DumpParserIn.model_validate(payload)


def test_round_trip_block_diff():
    BlockDiffIn.model_validate({"basket_id": "b" * 32})


def test_round_trip_block_manager():
    BlockManagerIn.model_validate({})


def test_round_trip_basket_composer():
    BasketComposerIn.model_validate({})


def test_round_trip_research():
    ResearchIn.model_validate({})


def test_round_trip_audit():
    AuditIn.model_validate({})


def test_round_trip_usage():
    UsageIn.model_validate({})


def test_round_trip_config():
    ConfigIn.model_validate({"brief_id": "a" * 32, "user_id": "u"})


def test_round_trip_compose_request():
    ComposeRequest.model_validate(
        {
            "user_id": "u",
            "user_intent": "test",
            "sub_instructions": "",
            "file_urls": [],
        }
    )


def test_optional_fields_skip():
    raw = {
        "id": "00000000-0000-0000-0000-000000000000",
        "user_id": "00000000-0000-0000-0000-000000000001",
        "label": "t",
        "content": "c",
    }
    data = ContextBlock.model_validate(raw)
    out = data.model_dump(mode="json", exclude_none=True)
    assert "meta_scope" not in out
