import importlib
import os
import sys
from unittest import mock

import jwt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))


@mock.patch("supabase.create_client")
def test_supabase_client_uses_service_role(mock_create):
    url = "http://example.com"
    key = jwt.encode({"role": "service_role"}, "secret", algorithm="HS256")
    os.environ["SUPABASE_URL"] = url
    os.environ["SUPABASE_SERVICE_ROLE_KEY"] = key

    if "app.utils.supabase_client" in sys.modules:
        del sys.modules["app.utils.supabase_client"]
    mod = importlib.import_module("app.utils.supabase_client")

    mock_create.assert_called_with(url, key)
    assert mod.SUPABASE_KEY_ROLE == "service_role"
