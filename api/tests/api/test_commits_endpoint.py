import os
import types
import uuid

from fastapi import FastAPI
from fastapi.testclient import TestClient

os.environ.setdefault("SUPABASE_URL", "http://localhost")
os.environ.setdefault("SUPABASE_ANON_KEY", "a.b.c")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "d.e.f")
from app.routes.commits import router as commits_router

app = FastAPI()
app.include_router(commits_router)

client = TestClient(app)


def _fake_table(name, store):
    def insert(row):
        store[name].append(row)
        return types.SimpleNamespace(execute=lambda: None)

    def _resp():
        return types.SimpleNamespace(data=store[name], count=len(store[name]))

    def select(*args, **kw):
        class _R:
            data = store[name]
            count = len(store[name])

            def eq(self, *a, **k):
                return types.SimpleNamespace(
                    execute=lambda: _resp(),
                    order=lambda *a2, **k2: types.SimpleNamespace(
                        range=lambda *a3, **k3: types.SimpleNamespace(execute=lambda: _resp())
                    ),
                    gt=lambda *a2, **k2: types.SimpleNamespace(execute=lambda: _resp()),
                )

        return _R()

    def eq(*args, **kw):
        return types.SimpleNamespace(select=lambda *a, **k: select(*a, **k))

    def order(*a, **k):
        return types.SimpleNamespace(
            range=lambda *a2, **k2: types.SimpleNamespace(
                execute=lambda: types.SimpleNamespace(data=store[name])
            )
        )

    def range(*a, **k):
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(data=store[name]))

    def gt(*a, **k):
        return types.SimpleNamespace(execute=lambda: types.SimpleNamespace(count=len(store[name])))

    return types.SimpleNamespace(
        insert=insert,
        select=select,
        eq=eq,
        order=order,
        range=range,
        gt=gt,
    )


def test_commit_endpoint(monkeypatch):
    store = {"dump_commits": [], "context_blocks": [], "block_change_queue": []}
    fake = types.SimpleNamespace(table=lambda n: _fake_table(n, store))
    monkeypatch.setattr("app.routes.commits.supabase", fake)

    cid = str(uuid.uuid4())
    fake.table("dump_commits").insert(
        {"id": cid, "basket_id": "b1", "summary": "msg", "created_at": "2025-06-17"}
    )
    for _ in range(3):
        fake.table("context_blocks").insert(
            {"id": str(uuid.uuid4()), "commit_id": cid, "version": 1}
        )
    fake.table("block_change_queue").insert(
        {"id": str(uuid.uuid4()), "commit_id": cid, "action": "update"}
    )

    res = client.get("/api/baskets/b1/commits")
    assert res.status_code == 200
    body = res.json()
    assert body[0]["new_blocks"] == 3
    assert body[0]["supersedes"] == 1
