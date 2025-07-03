import json
import os
import types
from pathlib import Path
from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "svc.key")

from app.routes.basket_new import router as basket_router
from app.services import template_cloner

app = FastAPI()
app.include_router(basket_router, prefix="/api")
client = TestClient(app)


def _fake_supabase(store):
    def table(name):
        store.setdefault(name, [])
        def insert(record):
            store[name].append(record)
            return types.SimpleNamespace(data=record, status_code=201)
        return types.SimpleNamespace(insert=insert)
    return types.SimpleNamespace(table=table)


def test_template_clone(monkeypatch, tmp_path):
    tpl_root = tmp_path / "templates"
    tpl = tpl_root / "brand_playbook"
    docs = tpl / "docs"
    docs.mkdir(parents=True)
    (tpl / "basket.json").write_text(json.dumps({"name": "Brand"}))
    (tpl / "blocks.json").write_text(json.dumps([{"type": "greeting", "content": "hi"}]))
    (docs / "intro.md").write_text("hello")

    store = {}
    fake = _fake_supabase(store)
    monkeypatch.setattr("app.routes.basket_new.supabase", fake)
    monkeypatch.setattr("app.services.template_cloner.supabase", fake, False)
    monkeypatch.setattr("app.routes.basket_new.publish_event", lambda *_a, **_k: None)
    monkeypatch.setattr("app.routes.basket_new.get_or_create_workspace", lambda _u: "ws")
    monkeypatch.setattr("app.routes.basket_new.verify_jwt", lambda *_a, **_k: {"user_id": "u"})
    monkeypatch.setattr(template_cloner, "TEMPLATE_ROOT", tpl_root)

    resp = client.post("/api/baskets/new", json={"template_slug": "brand_playbook"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"]
    assert len(store.get("baskets", [])) == 1
    assert len(store.get("blocks", [])) == 1
    assert len(store.get("documents", [])) == 1
