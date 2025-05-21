## codex/tasks/0_api_refactor_t11_finaltask_update_readme_devdocs.md

## Task 11: Update README and Developer Docs

**Goal:**  
Document your new agent task structure, so that future contributors (and yourself) can confidently understand, extend, or debug the backend.

---

### Instructions

1. **Update README.md (repo root):**
    - Explain the new agent_tasks directory layout.
    - Summarize core modules: agent_server.py, agent_tasks/ (with each agent’s own file), middleware/, util/.
    - Show the “one file per agent” principle.
    - List the main API endpoints (/agent, /profilebuilder, /profile_analyzer) and their basic payloads.

2. **Add a section:**  
    “How to Add a New Agent Task”:
    - Outline the steps to create a new agent:  
      • Create `agent_tasks/your_agent.py`  
      • Add the FastAPI router  
      • Register the endpoint in `agent_server.py`  
      • Update `task_types.json` and, if needed, `output_utils.py`
      • Test and document

3. **(Optional)**  
    - Add architecture diagrams or a file manifest for visual clarity.

4. **Commit:**  
