## codex/tasks/20240526_add_competitor_task_type.md

# Title
Add new **competitor research** Task-Type wired to the `competitor_agent`

# Root Cause / Context
We introduced `agent_tasks/competitor_agent.py`, but the Task-Type registry,
JSON schema, renderer, and route mapping are still missing.  
We now rely exclusively on same-origin `/api/*` routes, the `/api/reports`
list endpoint, and the `normalize_output()` util, so all paths in this task
should follow that pattern.

# Desired Outcome
A user can choose “Analyze My Competitors”, submit up to 5 handles/URLs, and
see a rendered `CompetitorTable` report in the UI list and detail pages.

# Deliverables & Steps

| # | Action | Path / File |
|---|--------|-------------|
| **1** | **Register the task-type** | `api/src/core/task_registry/seed/task_types.json` → add:<br>```json\n{\n  "id": "analyze_competitors",\n  "title": "Analyze My Competitors",\n  "description": "Compare up to 5 competitor handles and find differentiation opportunities.",\n  "agent_type": "competitor",\n  "input_fields": [\n    {\"name\":\"competitor_urls\",\"label\":\"Competitor URLs\",\"type\":\"list\"}\n  ],\n  "output_type": "CompetitorTable",\n  "enabled": true,\n  "version": "1"\n}``` |
| **2** | *(Optional)* Add JSON-Schema for front-end validation | `api/src/core/task_registry/validator_schemas/CompetitorTable.json` – mirror the `competitors[]` object you describe. |
| **3** | **Wire the agent** | a) `agent_tasks/__init__.py` (or central index) export `competitor_agent`.<br> b) Ensure `/agent-run` dispatcher can map `agent_type=="competitor"` to that object. |
| **4** | **Normalize agent output** | Inside `/agent-run` update logic (if not already):<br>`payload = { "output_type": task_type.id, "data": normalize_output(result) }` |
| **5** | **Create renderer** | `web/components/renderers/CompetitorTable.tsx` – simple table that expects:<br>`props.rows = [{ handle, positioning, tone, estimated_followers, notes }]` |
| **6** | **Map renderer** | In `RendererSwitch.tsx` add:<br>```ts\ncase \"CompetitorTable\":\n  return <CompetitorTable rows={(data as any).competitors} diff={data.differentiation_summary} />;\n``` |
| **7** | **Smoke-test locally** | `pnpm dev` (Next.js only) →<br>a) / tasks → “Analyze My Competitors”.<br>b) Submit `twitter.com/nytnews, naver.com`.<br>c) / reports list should show new row.<br>d) Click row → table or red error card renders. |
| **8** | **Commit & deploy** | `git add ...` → `git commit -m "feat: competitor task type"` → push. |

# Acceptance Criteria
* `/task-types` (GET) now includes `"analyze_competitors"`.
* `/api/agent-run` with that ID writes `output_json.data` as OBJECT (not string).
* `/api/reports/:id` returns that object.
* UI: list page shows card; detail page shows competitor table or error notice.
