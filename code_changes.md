
<!-- sed-style or patch chunks – e.g. -->
api/src/app/routes/blocks.py
- .select("id,label,type,updated_at,commit_id")
+ .select("id,label,type,created_at as updated_at,commit_id")
- .order("updated_at", desc=True)
+ .order("created_at", desc=True)

api/src/app/ingestion/job_listener.py
-        supabase.table("basket_blocks")
+        supabase.table("block_brief_link")

api/src/app/ingestion/job_listener.py
-        supabase.table("basket_blocks").insert(
+        supabase.table("block_brief_link").insert(

api/tests/api/test_dump_endpoint.py
-             "basket_blocks": _Stub(),
+             "block_brief_link": _Stub(),
