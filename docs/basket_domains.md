# Yarnnn Basket Lifecycle Domains

This document defines the canonical domains and flow for how basket-related processes work in Yarnnn. It serves as the source of truth for architecture, implementation, and documentation alignment.

---

## 🗂 Domains

### 1️⃣ **Create Basket — Inputs**
- **Purpose:** Collect and validate user intent.
- **What it handles:**  
  - Text dump input (required)  
  - File uploads (optional, e.g. images)  
  - Optional basket name  
  - Prepares payload for actual basket creation  

- **What it does not handle:**  
  - Block creation  
  - Content parsing  
  - Agent orchestration  

---

### 2️⃣ **Create Basket — Actual Creation + Agent Trigger**
- **Purpose:** Persist basket + input to database and trigger downstream processing.
- **What it handles:**  
  - Creates `baskets` record  
  - Creates `basket_inputs` record  
  - Links files if any  
  - Triggers orchestration agents (e.g. `orch_block_manager_agent`)  

- **What it does not handle:**  
  - Block parsing / promotion (this is agent responsibility)  
  - UI decisions  

---

### 3️⃣ **Baskets/[id]/work — Display Created Basket**
- **Purpose:** Present current state of the basket.
- **What it handles:**  
  - Displays narrative (user input dump)  
  - Displays blocks, commits, timeline  
  - Read-only view of current state  

- **What it does not handle:**  
  - Triggering agents (except via explicit user actions)  
  - Changing basket data  

---

### 4️⃣ **Baskets/[id]/work — Agent Enrichment + Dynamic Work**
- **Purpose:** Allow agents to enrich, recommend, and evolve basket content.
- **What it handles:**  
  - Summarization  
  - Recommendations  
  - Proposing block changes  
  - Populating change queue  

- **What it does not handle:**  
  - Collecting initial input  
  - Creating the basket  

---

## 🔄 **Simple Flow Diagram**

```mermaid
flowchart LR
  A([Create Basket Inputs])
  B([Create Basket + Trigger Agent])
  C([Work Page Display])
  D([Agent Enrichment + Dynamic Work])

  A --> B
  B --> C
  C --> D
  D --> C
