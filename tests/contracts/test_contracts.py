import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from schemas.audit import AuditIn
from schemas.block_manager import BlockManagerIn
from schemas.config import ConfigIn
from schemas.context_block import ContextBlock
from schemas.dump_parser import DumpParserIn
from schemas.dump import DumpOut
from schemas.basket import BasketOut
from schemas.research import ResearchIn
from schemas.usage import UsageIn



def test_round_trip_dump_parser():
    payload = {"basket_id": "a" * 32, "artifacts": [], "user_id": "u"}
    DumpParserIn.model_validate(payload)


def test_round_trip_block_manager():
    BlockManagerIn.model_validate({})


def test_round_trip_research():
    ResearchIn.model_validate({})


def test_round_trip_audit():
    AuditIn.model_validate({})


def test_round_trip_usage():
    UsageIn.model_validate({})


def test_round_trip_config():
    ConfigIn.model_validate({"brief_id": "a" * 32, "user_id": "u"})


def test_round_trip_dump_out():
    DumpOut.model_validate(
        {
            "input_id": "00000000-0000-0000-0000-000000000000",
            "chunk_ids": ["00000000-0000-0000-0000-000000000001"],
            "intent": "note",
            "confidence": 0.5,
            "commit_id": "00000000-0000-0000-0000-000000000002",
        }
    )


def test_round_trip_basket_out():
    BasketOut.model_validate(
        {
            "id": "00000000-0000-0000-0000-000000000000",
            "status": "draft",
            "intent_summary": "demo",
            "blocks": [],
            "configs": [],
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
