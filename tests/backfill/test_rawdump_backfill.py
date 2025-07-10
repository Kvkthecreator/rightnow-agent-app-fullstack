from pathlib import Path
import sqlite3


def test_rawdump_backfill():
    conn = sqlite3.connect(":memory:")
    conn.executescript(
        """
        CREATE TABLE baskets(
            id TEXT PRIMARY KEY,
            workspace_id TEXT
        );
        CREATE TABLE documents(
            id TEXT PRIMARY KEY,
            basket_id TEXT,
            created_at INTEGER
        );
        CREATE TABLE raw_dumps(
            id TEXT PRIMARY KEY,
            basket_id TEXT,
            created_at INTEGER,
            document_id TEXT
        );
        """
    )
    basket_id = "b1"
    conn.execute("INSERT INTO baskets(id, workspace_id) VALUES (?, ?)", (basket_id, "w"))
    for i in range(3):
        conn.execute(
            "INSERT INTO documents(id, basket_id, created_at) VALUES (?, ?, ?)",
            (f"d{i}", basket_id, i),
        )
        conn.execute(
            "INSERT INTO raw_dumps(id, basket_id, created_at) VALUES (?, ?, ?)",
            (f"r{i}", basket_id, i),
        )
    conn.commit()

    sql_path = Path(__file__).resolve().parents[2] / "sql" / "backfill" / "202507_backfill_rawdump_doc.sql"
    conn.executescript(sql_path.read_text())

    rows = conn.execute(
        "SELECT id, document_id FROM raw_dumps ORDER BY id"
    ).fetchall()
    assert rows == [("r0", "d0"), ("r1", "d1"), ("r2", "d2")]
