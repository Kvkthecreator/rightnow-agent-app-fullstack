# Yarnnn Basket Creation Flow — Canonical Baseline

This document defines the canonical domains and flow for basket creation in Yarnnn. It provides a stable reference for architecture, implementation, and Codex tasks.

---

## 1️⃣ Create Basket — Inputs (Input Domain)

👑 **Purpose:**  
Collect and validate user intent in a single input unit.

✅ **What the user provides:**  
- A text dump (typed or pasted into the textarea; required)  
- Zero or more file uploads (currently images; optional, max N files)  
- An optional basket name  

✅ **What happens in this domain:**  
- Uploads files to storage (e.g. Supabase storage, returns URLs)  
- Validates that required text is provided  
- Prepares the full input payload (text + file URLs + optional name)  

❌ **What this domain does *not* handle:**  
- Creating basket records  
- Creating input records  
- Triggering agents  
- Creating or promoting blocks  

👉 **Key principle:**  
The input domain ensures we collect one atomic input unit per basket — the user’s intent as a single cohesive submission.

---

## 2️⃣ Create Basket — Actual Creation + Agent Trigger (Creation Domain)

👑 **Purpose:**  
Persist the basket + input to the database and initiate downstream orchestration.

✅ **What happens in this domain:**  
- Creates a `baskets` record  
- Creates a `basket_inputs` record linking text + uploaded file URLs  
- Triggers orchestration agent(s) (e.g. `orch_block_manager_agent`)  
- Publishes events (e.g. `basket.compose_request`)  

❌ **What this domain does *not* handle:**  
- Direct block creation  
- Block parsing  
- Change queue management  

👉 **Key principle:**  
Basket creation records and orchestration triggers are transactional; agents handle content parsing + enrichment separately.

---

## 3️⃣ Agent Work (Post-Creation)

👑 **Purpose:**  
Enrich and evolve the basket by parsing inputs and promoting blocks.

✅ **What happens:**  
- Parses input text + files  
- Creates context blocks as appropriate  
- Populates change queue  
- Updates commit log  

👉 **Key principle:**  
All parsing and block promotion happen *after* basket creation, as part of the agent enrichment domain.

---

## 4️⃣ Current Supported Modalities

- Text dump: string (required)  
- Image files: 0 or more (optional)

👉 These form one cohesive input unit at basket creation.

---

## 5️⃣ Design Philosophy

- Basket creation represents a single, atomic user intent submission.  
- Multi-modal support means text + files together form the input unit — no splitting during creation.  
- Parsing + block creation are agent responsibilities, not basket creation responsibilities.

---

## 6️⃣ Future Modality Extensions

- New modalities (e.g. audio, rich text, links) extend the input model without changing the flow.
- Basket creation will continue to handle one cohesive input unit per submission.

---

## 📌 Usage

This document serves as the canonical reference for basket creation flows.  
All architecture, PRs, Codex tasks, and reviews must align to this structure.  
Edit this file only in the case of major architectural changes.

