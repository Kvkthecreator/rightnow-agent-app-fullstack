"""Backfill basket_inputs rows into dump_artifacts."""

from app.agent_tasks.layer1_infra.utils.supabase_helpers import get_supabase


def main() -> None:
    supabase = get_supabase()
    resp = supabase.table("basket_inputs").select("*").execute()
    rows = resp.data or []

    migrated = 0
    for row in rows:
        content = row.get("content")
        if not content or not str(content).strip():
            continue
        artifact = {
            "basket_id": row["basket_id"],
            "input_id": row["id"],
            "type": "text",
            "content": content,
            "associated_text": row.get("meta_notes"),
            "file_id": None,
        }
        supabase.table("dump_artifacts").insert(
            artifact, ignore_duplicates=True
        ).execute()
        migrated += 1

    print(f"Migrated {migrated} rows.")


if __name__ == "__main__":
    main()
