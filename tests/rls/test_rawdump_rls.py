import types
import uuid


class Table:
    def __init__(self, store, name, workspace):
        self.store = store
        self.name = name
        self.workspace = workspace

    def insert(self, row):
        row = {**row}
        row.setdefault("id", str(uuid.uuid4()))
        row.setdefault("workspace_id", self.workspace)
        self.store.setdefault(self.name, []).append(row)
        return types.SimpleNamespace(data=[row])

    def select(self, _cols="*"):
        filters = {}

        def eq(col, val):
            filters[col] = val
            return query

        def execute():
            rows = self.store.get(self.name, [])
            for c, v in filters.items():
                rows = [r for r in rows if r.get(c) == v]
            rows = [r for r in rows if r.get("workspace_id") == self.workspace]
            return types.SimpleNamespace(data=rows)

        query = types.SimpleNamespace(eq=eq, execute=execute)
        return query


class FakeClient:
    def __init__(self, store, workspace):
        self.store = store
        self.workspace = workspace

    def table(self, name):
        return Table(self.store, name, self.workspace)


def test_rawdump_rls(workspace_a_jwt, workspace_b_jwt):
    store = {}
    client_a = FakeClient(store, "wsA")
    client_b = FakeClient(store, "wsB")

    client_a.table("raw_dumps").insert({"body_md": "hi"})

    a_rows = client_a.table("raw_dumps").select("*").execute().data
    assert len(a_rows) == 1

    b_rows = client_b.table("raw_dumps").select("*").execute().data
    assert b_rows == []
