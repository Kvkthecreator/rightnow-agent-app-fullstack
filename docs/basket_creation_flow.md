# Yarnnn Basket Creation Flow — Canonical Baseline

## 1️⃣ Create Basket — Inputs

👑 **Purpose:** Capture atomic user intent (base text + optional modalities).

✅ **What happens:**  
- Basket + input records are created immediately (resilient core intent capture).  
- Modalities (e.g. files) are handled in sidecar subflows that do not block basket creation.

## 2️⃣ Create Basket — Actual Creation + Agent Trigger

👑 **Purpose:** Persist basket and input, trigger orchestration agent.

✅ **What happens:**  
- Basket and input records inserted.  
- Orchestration fires.  
- Modality sidecar handling continues independently.

## Design Comments

📌 Modalities are additive — their failure or delay does not block base basket creation.  
📌 Future modalities (e.g. audio) follow this same pattern, no further doc changes expected.

## 🔧 Required Environment Variables

Basket creation relies on the Supabase keys. See [`.env.template`](../.env.template) for the canonical list and guidance.
