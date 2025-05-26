## codex/tasks/web_jamietest_markdowndebug.md

What I Want

Refactor the profile analysis flow to use a hybrid approach:
Render the structured report object as components for the best user experience.
Also accept a report_markdown string in the API response for export/share (Notion).
Add a “Copy as Markdown” or “Export to Notion” button that uses report_markdown.
Context

Agent backend should generate both the structured object and markdown.
The frontend should render both (components for UI, markdown for export).
Step-by-step

Agent: Update to always generate both report (object) and report_markdown (markdown string).
API Response: Always includes both fields.
Frontend:
Render UI from report (componentized).
Show a button for users to copy/export markdown.
Button copies report_markdown to clipboard or triggers Notion export.
Bonus: Optionally, add a preview modal to see the markdown version.
Acceptance

Users see a beautiful component-based UI.
Users can easily export/share the same report as Markdown (for Notion, docs, etc.).
No data loss or markdown bugs.
TL;DR

Use structured data for the best UX.
Always include a markdown version for sharing/export.
UI does not have to be markdown-based; just make markdown export available as an option.