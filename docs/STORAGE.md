## 📦 Supabase Buckets (Context OS)

| Bucket        | Purpose | storage_domain |
|---------------|---------|----------------|
| `block-files` | Structured files that form context blocks at basket creation | block-files |
| `basket-dumps` | Unstructured user dumps for agent parsing post-creation | basket-dumps |
| `user-library` | Persistent reusable uploads (e.g., logos, brand kits) | user-library |

All files are tracked in `block_files`, and uploads during `/basket/create` must be tagged with `storage_domain = block-files`.

Buckets are public to enable frontend previewing of images or text assets.
