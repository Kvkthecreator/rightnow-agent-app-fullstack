# Migration & Code Reconciliation Plan

The LIVE schema snapshot differs from the codebase in several places.  
Each item below lists the resolution—either a migration or a code change.

1. **context_blocks.updated_at**
   - **Action:** Add column via migration.
   - **Migration:** `0002_add_updated_at_context_blocks.sql`

2. **context_blocks.is_draft, is_superseded, basket_id, tags**
   - **Action:** Add missing columns.
   - **Migration:** `0003_add_draft_fields_to_context_blocks.sql`

3. **context_blocks.meta_scope vs meta_context_scope**
   - **Action:** Rename `meta_context_scope` → `meta_scope`.
   - **Migration:** `0004_rename_meta_context_scope.sql`

4. **basket_blocks table references**
   - **Action:** Remove references and use `block_brief_link`.
   - **Code change:** update `api/src/app/ingestion/job_listener.py` lines 54‑64.

5. **ingestion_jobs table missing**
   - **Action:** Create table for the ingestion worker queue.
   - **Migration:** `0005_create_ingestion_jobs.sql`

6. **task_briefs renamed to baskets & new related tables**
   - **Action:** Rename table and create `basket_inputs`, `basket_threads`,
     `basket_configs`, and `dump_commits`.
   - **Migration:** `0006_baskets_and_related_tables.sql`

7. **block_change_queue table**
   - **Action:** Add table with columns (action, block_id, proposed_data, etc.).
   - **Migration:** `0007_create_block_change_queue.sql`

8. **brief_configs table**
   - **Action:** Create table for rendered brief configs.
   - **Migration:** `0008_create_brief_configs.sql`

9. **Node client references to meta_scope, is_core_block, update_policy**
   - **Action:** Update TypeScript files to match final column set
     (`context_blocks.meta_scope`, `is_core_block`, `update_policy`).
   - **Code change:** patch `web/lib/supabase/blocks.ts` lines 25‑50 and any
     interfaces.

10. **dump_artifacts table**
    - **Action:** Create table for archived inputs.
    - **Migration:** `0009_create_dump_artifacts.sql`

All migrations include `DOWN` sections to drop the columns or tables in reverse
order.  After applying these, the codebase and database are aligned.
