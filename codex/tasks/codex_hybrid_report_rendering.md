## codex/tasks/codex_hybrid_report_rendering.md

codex_hybrid_report_rendering.md
What I Want

Refactor the profile report page (jamie-test) to:
Render the profile analysis from the structured report object (component-based, not markdown).
If the API returns a report_markdown field, add a “Copy Markdown” button to copy it for Notion or sharing.
Ensure clean and styled UX for all fields: summary, readiness, sections, CTA.
Step-by-Step

Update frontend state to store the whole report object.
Render the page using the fields of report.
If report_markdown exists, add a “Copy Markdown” button.
Keep code and UI clean and simple.
Acceptance

The page is rich and styled with React components.
Users can copy/share a markdown export for Notion.
No markdown rendering warnings, and UX is always robust.
