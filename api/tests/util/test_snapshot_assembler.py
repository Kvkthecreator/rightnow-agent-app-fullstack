from app.util.snapshot_assembler import assemble_snapshot


def test_assemble_filters_states():
    blocks = [
        {"id": "1", "state": "ACCEPTED"},
        {"id": "2", "state": "PROPOSED"},
        {"id": "3", "state": "LOCKED"},
    ]
    raw = ["a"]
    snap = assemble_snapshot(raw, blocks)
    assert len(snap["blocks"]) == 2
    assert snap["raw_dumps"] == ["a"]
