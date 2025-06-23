# 📄 **Baskets API Contract**

> Scope: Backend ↔ frontend interface for creating baskets (atomic intent material capture) and for upholding the non‑negotiable rules that defend the context contract model.
> 
> 
> **Audience:** Web/client developers, agent authors, Codex tasks.
> 

---

## 0️⃣ **Design Invariants 🚦**

| ID | Invariant | Rationale |
| --- | --- | --- |
| **I‑1** | Every *row* that belongs to a workspace **must carry `workspace_id` NOT NULL**. | Enables RLS policies that do *not*rely on `auth.uid()` directly. |
| **I‑2** | `user_id` columns are **allowed** but treated as legacy; they must be nullable and excluded from business logic filters. | Prevents reintroducing direct-user coupling. |
| **I‑3** | All SELECT / INSERT policies for workspace tables use the same membership sub‑query:`workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())` | Single source of truth for access rules. |
| **I‑4** | Clients **always send** the Supabase session JWT in `sb-access-token` (FastAPI) and `Authorization: Bearer` (PostgREST). | Ensures RLS can evaluate membership. |
| **I‑5** | No column names, enums, or view definitions in this file change silently — any change is breaking and requires version bump + PR doc update. | Protects agent/frontend stability and contract integrity. |

---

## 1️⃣ **Endpoint**

### 🧺 POST `/api/baskets`

Creates a new basket (context contract container) and its originating intent material (raw_dump).

### Required Headers

| Header | Example | Purpose |
| --- | --- | --- |
| `sb-access-token` | `eyJ…` | Supabase session — caller identity & workspace context |
| `Content-Type` | `application/json` | — |

---

### JSON Body

<details><summary><strong>V2 payload (preferred)</strong></summary>

```
jsonc
CopyEdit
{
  "topic": "Launch spring campaign",
  "intent": "Drive sign-ups via socials",
  "insight": "Target Gen Z",
  "blocks": [
    {
      "semantic_type": "topic",
      "label": "Launch spring campaign",
      "content": "Launch spring campaign",
      "is_primary": true,
      "meta_scope": "basket"
    },
    {
      "semantic_type": "reference",
      "label": "campaign_brief.pdf",
      "content": "https://…/block_files/…/brief.pdf",
      "is_primary": true,
      "meta_scope": "basket",
      "source": "user_upload"
    }
  ]
}

```

</details> <details><summary><strong>V1 payload (legacy — still accepted)</strong></summary>

```json
json
CopyEdit
{ "text_dump": "free-form markdown or plain text" }

```

</details>

> Payload limits:
> 
> - Max **25 blocks**
> - Max **32 kB** total JSON size
> - File URLs must already exist in `block_files` bucket

---

### Success Response `201 Created`

```json
json
CopyEdit
{ "id": "uuid-of-basket" }

```

---

### Error Codes

| Status | Reason | Typical fix |
| --- | --- | --- |
| `401` | missing or expired JWT | login & retry |
| `403` | caller not a member of workspace | request invitation |
| `422` | payload validation failed (see `detail`) | correct JSON |
| `500` | unexpected server error | check logs / open ticket |

---

## 2️⃣ **Server-Side Algorithm (canonical)**

```mermaid
mermaid
CopyEdit
sequenceDiagram
  participant C as Client
  participant A as /api/baskets
  participant SB as Supabase

  C->>A: POST /api/baskets (JWT + JSON)
  A->>SB: get_or_create_workspace(JWT.sub)
  A->>SB: INSERT raw_dumps { body_md, workspace_id }
  A->>SB: INSERT baskets { name, raw_dump_id, workspace_id }
  alt blocks[] present
    loop each block
      A->>SB: INSERT blocks { semantic_type, content, workspace_id, basket_id }
    end
  end
  A-->>C: 201 { id }

```

✅ All writes occur inside a single transaction — atomicity protects context contract integrity.

---

## 3️⃣ **View `v_basket_overview` (read model)**

```sql
sql
CopyEdit
CREATE OR REPLACE VIEW public.v_basket_overview AS
SELECT  b.*, rd.body_md AS raw_dump_body, rd.file_refs
FROM    public.baskets b
JOIN    public.raw_dumps rd ON rd.id = b.raw_dump_id
WHERE   b.workspace_id IN (
  SELECT workspace_id FROM public.workspace_memberships
  WHERE  user_id = auth.uid()
);

```

👉 Never filter on `user_id` — **workspace membership is the contract gatekeeper**.

---

## 4️⃣ **Change Control 🛑**

- Any change to request/response schema, column names, or view signatures requires:
    
    1️⃣ PR that updates **this file**
    
    2️⃣ Bump of `API_VERSION` constant in `/web/lib/apiVersion.ts`
    
    3️⃣ Migration in `/api/migrations/YYYYMMDD-*.sql`
    

👉 Consumers must check API version header to ensure compatibility.

---

## 5️⃣ **FAQ**

**Q: Why not drop `user_id` entirely?**

*A:* Historic rows contain it; retaining as nullable avoids unnecessary backfill and supports analytics.

**Q: How do agents determine workspace?**

*A:* Agents are passed `basket.workspace_id` and must include it in all writes. Agents must never query `auth.uid()`.

**Q: Can blocks exist without a basket?**

*A:* Yes — but they must carry `workspace_id`. Orchestration may later link them to a basket.

---

*Last updated: 2025‑06‑23 — aligned with Context Contract First Principles.*