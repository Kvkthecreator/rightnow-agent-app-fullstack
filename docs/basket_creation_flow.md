# Yarnnn Basket Creation Flow — Canonical Baseline

## 1️⃣ Create Basket — Inputs

👑 **Purpose:** Capture atomic user intent (base text + optional modalities).

Example payload for `/api/baskets/new`:

```json
{
  "text_dump": "Launch ideas for Q3",
  "file_urls": []
}
```

✅ **What happens:**
- Basket + input records are created immediately (resilient core intent capture).  
- Modalities (e.g. files) are handled in sidecar subflows that do not block basket creation.

## 2️⃣ Create Basket — Actual Creation + Agent Trigger

👑 **Purpose:** Persist basket and input, trigger orchestration agent.

✅ **What happens:**
- **Step 1 → raw_dump insert** (immutable capture)  
- **Step 2 → basket insert** (FK `raw_dump_id` now satisfied)  
- Orchestration agent fires.
- Modality sidecar handling continues independently.

## Design Comments

📌 Modalities are additive — their failure or delay does _not_ block base basket creation.
📌 Future modalities (e.g. audio) follow this same pattern, no further doc changes expected.
