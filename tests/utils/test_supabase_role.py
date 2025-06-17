import os
import sys

import jwt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from app.utils.supabase_client import _decode_key_role


def test_decode_key_role():
    token = jwt.encode({"role": "service_role"}, "secret", algorithm="HS256")
    assert _decode_key_role(token) == "service_role"
