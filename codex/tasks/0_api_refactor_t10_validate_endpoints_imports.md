## codex/tasks/0_api_refactor_t10_validate_endpoints_imports.md

## Task 10: Validate All Endpoints and Imports

**Goal:**  
Ensure all FastAPI endpoints and agent task modules are correctly wired up and importable.

---

### Instructions

1. **Smoke-test each main endpoint:**
   - `/agent` (Manager)
   - `/profilebuilder` (ProfileBuilder)
   - `/profile_analyzer` (ProfileAnalyzer)

2. **For each, send a minimal valid POST payload** (mocking what the frontend would send) and verify:
   - Endpoint returns a valid (non-500) response.
   - Output is structurally correct (check for key fields, not just status code).

3. **Import validation:**
   - For each module in `agent_tasks/` and its middleware, run `python3 -m py_compile` or equivalent to ensure no ImportError.

4. **If any failures:**
   - Document the error in the Codex output.
   - Suggest or perform a fix (update import, fix missing module, etc.), then rerun the test.

5. **Commit:**  
