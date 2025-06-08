# 🧺 POST /api/baskets

Creates a new basket and saves context blocks + file references.

## Expected Payload
```json
{
  "topic": "Launch spring campaign",
  "intent": "Drive signups via social posts",
  "insight": "Targeting Gen Z, not millennials",
  "blocks": [
    {
      "type": "topic",
      "label": "Launch spring campaign",
      "content": "Launch spring campaign",
      "is_primary": true,
      "meta_scope": "basket"
    },
    {
      "type": "intent",
      "label": "Drive signups",
      "content": "Drive signups via social posts",
      "is_primary": true,
      "meta_scope": "basket"
    },
    {
      "type": "reference",
      "label": "campaign_brief.pdf",
      "content": "https://xyz.supabase.co/storage/v1/object/public/block-files/...",
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
- Uploaded files must already exist in `block-files` bucket before API call
- Blocks are auto-linked to basket and ready for downstream orchestration
