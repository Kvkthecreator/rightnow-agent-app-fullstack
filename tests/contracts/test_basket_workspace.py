import pytest
import supabase_py
import os
from uuid import uuid4

sb = supabase_py.create_client(os.environ["SUPABASE_URL"], os.environ["SERVICE_ROLE"])


def test_basket_insert_links_workspace():
    user_id = str(uuid4())
    ws_id = str(uuid4())
    # seed workspace & membership
    sb.table("workspaces").insert({"id": ws_id, "owner_id": user_id, "name": "tmp"}).execute()
    sb.table("workspace_memberships").insert({"workspace_id": ws_id, "user_id": user_id}).execute()

    dump = sb.table("raw_dumps").insert({"body_md": "## hi", "workspace_id": ws_id}).execute()
    basket = sb.table("baskets").insert(
        {"name": "unit-test", "raw_dump_id": dump.data[0]["id"], "workspace_id": ws_id}
    ).execute()

    row = sb.table("baskets").select("*").eq("id", basket.data[0]["id"]).single().execute()
    assert row.data["workspace_id"] == ws_id
