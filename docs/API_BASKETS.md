# 🧺 POST /api/baskets

Creates a new basket and saves context blocks + file references.

## Expected Headers
`sb-access-token`: Supabase session JWT (determines workspace context)

## Expected Payload
```json
{
  "topic": "Launch spring campaign",
  "intent": "Drive signups via social posts",
  "insight": "Targeting Gen Z, not millennials",
  "blocks": [
    {
      "semantic_type": "topic",
      "label": "Launch spring campaign",
      "content": "Launch spring campaign",
      "is_primary": true,
      "meta_scope": "basket"
    },
    {
      "semantic_type": "intent",
      "label": "Drive signups",
      "content": "Drive signups via social posts",
      "is_primary": true,
      "meta_scope": "basket"
    },
    {
      "semantic_type": "reference",
      "label": "campaign_brief.pdf",
      "content": "https://xyz.supabase.co/storage/v1/object/public/block_files/...",
      "is_primary": true,
      "meta_scope": "basket",
      "source": "user_upload"
    }
  ]
}
```

## Result
```json
{
  "id": "basket_uuid"
}
```

## Notes
- Uploaded files must already exist in `block_files` bucket before API call
- The endpoint first persists the user input to **`raw_dumps`** and then
  creates the `basket` referencing it via `raw_dump_id` (atomic intent capture).
- Blocks are auto-linked to the basket and are ready for downstream orchestration
