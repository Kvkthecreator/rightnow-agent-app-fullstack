import os
import sys

import jwt

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../api/src"))

from fastapi import FastAPI, Header, HTTPException
from fastapi.testclient import TestClient

from app.utils.supabase_client import _decode_key_role


def test_decode_key_role():
    token = jwt.encode({"role": "service_role"}, "secret", algorithm="HS256")
    assert _decode_key_role(token) == "service_role"


def test_basket_create_auth_header():
    app = FastAPI()

    @app.post("/baskets")
    def create(authorization: str | None = Header(None)):
        if authorization != "Bearer token":
            raise HTTPException(status_code=403)
        return {"ok": True}

    client = TestClient(app)
    # Missing header should 403
    resp = client.post("/baskets")
    assert resp.status_code == 403

    # Valid header should succeed
    resp = client.post("/baskets", headers={"Authorization": "Bearer token"})
    assert resp.status_code == 200
