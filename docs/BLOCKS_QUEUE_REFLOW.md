# **Block and Queue Scope Management — Canonical**

*Updated: 2025‑06‑23 — aligned with Context Contract First Principles*

---

## 🧠 **`context_blocks.meta_scope` — Contractual Origin**

This field defines **where and how a block originated** — i.e. what authority context it belongs to.

It governs **who may evolve it, and under what rules.**

| `meta_scope` | Origin | Contractual Meaning |
| --- | --- | --- |
| `basket` | Created directly during basket/task setup | User-authored clause — high trust, protected by default |
| `profile` | Created during profile onboarding | Semi-structured user input — editable with user review |
| `agent` | Proposed by orchestration/LLM agent | System-generated hypothesis — low authority, safe to evolve |
| `global` | Supplied by system/team config | Canonical invariant — enforced across all baskets |

---

## 🔒 **Scope Governance Rules**

✅ `basket`-scoped blocks:

- Treated as **user-authored contract clauses**
- May **not be auto-updated**
- All mutations require **manual approval via the change queue**

✅ `agent`-scoped blocks:

- Treated as **agent-proposed hypotheses**
- May be evolved or revised by orchestration agents
- Subject to validation and promotion by users

✅ `profile`-scoped blocks:

- Structured onboarding input
- Can be enriched or evolved — but **require confirmation** before promotion

✅ `global` blocks:

- Contextual constants across workspace/org
- Cannot be mutated by any agent
- Changes require **explicit admin-level workflows**

---

## 📦 **Queue Contract (`block_change_queue`)**

Each queue entry now includes:

```
ts
CopyEdit
{
  block_id: uuid;
  proposed_change: {...};
  source_scope: "basket" | "agent" | "profile" | "global";
}

```

> source_scope allows the system to enforce safe handling based on origin.
> 

---

## ⚙️ **Worker Behavior — `apply_queue_worker`**

✅ Skips queued changes to `meta_scope = 'basket'` blocks unless:

- Explicit override flag is present (`force_update: true`)
- Manual user approval exists in the commit log

✅ Logs rejected/conflicting updates for review and debugging

✅ Automatically applies safe updates only for `agent`-scoped blocks

---

## ✅ **Summary Principles**

- **Scope = contract origin + authority rule**
- The system defends user-authored and canonical clauses unless given clear permission to override
- Queue processors operate defensively — **never mutate trusted clauses without confirmation**