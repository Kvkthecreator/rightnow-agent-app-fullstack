# docs/basket_creation_flow.md
# Yarnnn Basket Creation Flow — Canonical Baseline

**Version 1.0 — aligned with Basket–Block–Lock–Constant Contract v1**

This document defines the canonical *process* (Domains 1 & 2) for basket creation. Schema and authority rules live in **Basket–Block–Lock–Constant Contract v1**.

---

## 1️⃣ Create Basket — Inputs (Input Domain)

👑 **Purpose**  Faithfully capture a single, atomic user intent submission (*input unit*).

### What the user provides

* Raw text dump (**required**)
* Zero or more file uploads (images for now)
* Optional basket name

### What happens in this domain

1. Validate that text is present.
2. Upload files → get `file_urls` from Supabase.
3. Prepare **payload**:

   ```json
   {
     "text_dump": "...",
     "file_urls": ["..."],
     "basket_name": "..."
   }
   ```

### Markdown handling

*Pass‑through only.* Rendering happens later in the work page.

### What this domain **does not** handle

* Creating `baskets` or **`raw_dumps`** rows
* Triggering agents
* Parsing / block creation

👉 Key principle  **No transformation, only faithful capture.**

---

## 2️⃣ Create Basket — Persistence & Agent Trigger (Creation Domain)

👑 **Purpose**  Persist the basket + input and kick off downstream orchestration.

### What happens in this domain

* Insert into `baskets` (state =`INIT`).
* Insert immutable **`raw_dumps`** row linking text + `file_refs`.
* Fire event `basket.compose_request` → launches `orch_block_manager_agent`.

### What this domain **does not** handle

* Block parsing or promotion
* Change‑queue management

👉 Key principle  Basket persistence is transactional; enrichment belongs to Agent Work.

---

## 3️⃣ Agent Work (post‑creation) — *See Basket Management Flow*

Once the basket exists, agents parse, propose blocks, populate the change queue, and write **Revisions**/**Events**.

---

## 4️⃣ Current modalities

* Text dump (string, required)
* Images (0‑N)

---

## 5️⃣ Design philosophy

* Creation = single atomic submission.
* Text + files are inseparable at creation time.
* Structure emerges later via agents and user approval.

---

## 6️⃣ Future modality extensions

Audio, links, rich text, etc. extend the payload but keep the same two‑domain flow.

---

## 🔧 Required environment variables

Frontend needs Supabase anon & upload keys — see **env\_supabase\_reference.md**.

---

## 📌 Usage

All PRs and Codex tasks touching basket creation **must** align with this flow *and* the authority contract. Edits require architectural review.
