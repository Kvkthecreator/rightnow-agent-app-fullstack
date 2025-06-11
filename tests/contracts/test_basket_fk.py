import os
import sys
from uuid import uuid4

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))
from schemas.context_block import ContextBlock


def test_basket_id_pass_through():
    b = ContextBlock(label="demo", content="x", user_id="u", basket_id=uuid4())
    dumped = b.model_dump(exclude_none=True)
    assert "basket_id" in dumped
