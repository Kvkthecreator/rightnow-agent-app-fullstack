# Raw Dump Document Backfill

Run once after deploying migrations that add `document_id` to `raw_dumps`.

```bash
psql "$DATABASE_URL" -f sql/backfill/202507_backfill_rawdump_doc.sql
```

This script pairs each `raw_dump` with a document in the same basket
using creation order. Only rows with a `NULL` `document_id` are updated.
