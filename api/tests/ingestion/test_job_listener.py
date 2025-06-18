import types
import uuid

from app.ingestion.job_listener import process_once

_STORES: dict[str, list[dict]] = {}


def _fake_table(name: str):
    storage = {"rows": _STORES.setdefault(name, [])}

    def insert(obj):
        storage["rows"].append(obj)
        return types.SimpleNamespace(execute=lambda: None)

    def update(obj):
        for row in storage["rows"]:
            row.update(obj)

        class _Upd:
            def eq(self, column, value):  # noqa: D401
                return self

            def execute(self):  # noqa: D401
                return None

        return _Upd()

    def delete():
        storage["rows"].clear()

        class _Del:
            def eq(self, *_a, **_k):  # noqa: D401
                return self

            def execute(self):  # noqa: D401
                return None

        return _Del()

    def eq(column, value):
        class _Resp:
            data = [r for r in storage["rows"] if r.get(column) == value]

            def execute(self):  # noqa: D401
                return types.SimpleNamespace(data=self.data)

        return _Resp()

    def select(*_a, **_k):
        class _Sel:
            data = storage["rows"]

            def limit(self, *_1, **_2):
                return self

            def eq(self, column, value):
                self.data = [r for r in storage["rows"] if r.get(column) == value]
                return self

            def execute(self):  # noqa: D401
                return types.SimpleNamespace(data=self.data)

        return _Sel()

    return types.SimpleNamespace(
        select=select,
        insert=insert,
        update=update,
        delete=delete,
        eq=eq,
    )


def test_process_once(monkeypatch):
    fake = types.SimpleNamespace(table=lambda name: _fake_table(name))
    monkeypatch.setattr("app.ingestion.job_listener.supabase", fake)

    blk_id = str(uuid.uuid4())
    fake.table("context_blocks").insert(
        {
            "id": blk_id,
            "basket_id": "bkt",
            "is_draft": True,
            "label": "hello",
            "content": "hello",
        }
    )

    fake.table("ingestion_jobs").insert(
        {"id": "job1", "draft_block_id": blk_id, "basket_input_id": "in1"}
    )

    process_once()

    blocks = fake.table("context_blocks").select().data
    assert blocks[0]["is_draft"] is False

    assert fake.table("ingestion_jobs").select().data == []
