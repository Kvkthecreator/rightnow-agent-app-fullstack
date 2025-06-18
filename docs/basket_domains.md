# docs/BASKET_DOMAINS.md
# yarnnn Basket Lifecycle Domains
*** → For schema & authority rules see **Basket–Block–Lock–Constant Contract v1 *** 

This document defines the canonical domains and flow for basket-related processes in yarnnn. It serves as the source of truth for architecture, implementation, and documentation alignment.

---

## 🗂 Domains

### 1️⃣ **Create Basket — Inputs**
- **Purpose:**  
  Faithfully collect and validate the user’s atomic intent submission — the *input unit*.

- **What it handles:**  
  - Raw text dump input (required)  
  - File uploads (optional, e.g. images)  
  - Optional basket name  
  - Prepares payload: text + file URLs + name for persistence  

- **Markdown handling:**  
  - Preserves any Markdown syntax provided by the user.
  - Does not prettify, parse, or insert Markdown.
  - Pass-through only; rendering happens later.

- **What it does not handle:**  
  - Creating basket or input records  
  - Triggering agents  
  - Block creation, parsing, or promotion  

---

### 2️⃣ **Create Basket — Actual Creation + Agent Trigger**
- **Purpose:**  
  Persist the basket + input unit in the database and initiate downstream orchestration.

- **What it handles:**  
  - Creates `baskets` record (container for workspace)  
  - Creates `basket_inputs` record (persists raw dump + file references)  
  - Triggers orchestration agents (e.g. `orch_block_manager_agent`)  
  - Publishes events (e.g. `basket.compose_request`)

- **What it does not handle:**  
  - Block creation, parsing, or promotion (belongs to agent enrichment domain)  
  - Narrative assembly or prettification  
  - Workspace display logic  

---

### 3️⃣ **Baskets/[id]/work — Display Created Basket**
- **Purpose:**  
  Render the current basket workspace for the user.

- **What it handles:**  
  - Displays narrative view: raw dump rendered with Markdown (if present)  
  - Displays promoted blocks, commits, and change queue  
  - Read-only view of current basket state  

- **What it does not handle:**  
  - Creating or persisting data  
  - Running agents (except via explicit user actions)  
  - Proposing or modifying content  

---

### 4️⃣ **Baskets/[id]/work — Agent Enrichment + Dynamic Work**
- **Purpose:**  
  Transform and evolve the basket by parsing input, promoting blocks, and proposing enhancements.

- **What it handles:**  
  - Parses input text + files  
  - Creates and promotes context blocks  
  - Populates and manages change queue  
  - Provides summarization, recommendations, and structural improvements  

- **What it does not handle:**  
  - Collecting initial input  
  - Directly creating or editing basket or input records  

---

## 🔄 **Simple Flow Diagram**

flowchart LR
  A([Create Basket Inputs])
  B([Create Basket + Trigger Agent])
  C([Work Page Display])
  D([Agent Enrichment + Dynamic Work])

  A --> B
  B --> C
  C --> D
  D --> C
