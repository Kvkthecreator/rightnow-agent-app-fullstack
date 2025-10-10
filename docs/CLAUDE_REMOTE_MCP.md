# Claude Remote MCP Launch Notes

This note captures the Anthropic guidance for publishing Yarnnn as a remote MCP
connector for Claude (chatanthropic.com + Claude Desktop).

## Availability & Plans
- Remote MCP custom connectors are available to Claude Pro, Max, Team, and
  Enterprise plans (currently beta).
- Team/Enterprise: only Primary Owners/Owners can register a connector; each
  user must connect & enable it individually.
- Pro/Max: users add the connector via **Settings → Connectors**.

## Registration Flow (Org Admins)
1. Navigate to **Admin settings → Connectors** (Team/Enterprise) or
   **Settings → Connectors** (Pro/Max).
2. Click **Add custom connector**.
3. Provide the Yarnnn MCP HTTPS endpoint.
4. (Optional) Supply OAuth Client ID/Secret if the server requires it (Yarnnn
   uses integration tokens rather than OAuth for Claude today).
5. Save to make the connector available to users.

## User Enablement
- Users open the **Search and tools** menu, locate the Yarnnn connector, and
  click **Connect** to pass their integration token (or other auth prompt).
- After connecting, users toggle individual tools; disable anything unrelated
  before running Research (Claude’s autonomous mode).

## Security Reminders (from Anthropic guidance)
- Remote MCP servers are unverified; remind users to only connect to Yarnnn’s
  official endpoint and to review tool invocation prompts before approving.
- Write-capable tools should remain disabled unless the user intends to use
  them; Yarnnn surfaces confirmation copy for writes to help with this.
- Research mode can auto-invoke tools; document recommended settings (e.g.
  disable write actions during Research sessions).

## Removal / Editing
- Users can remove or edit the connector from **Settings → Connectors** via
  the three-dot menu next to Yarnnn.

## Support Playbook
- Publish a short "Add Yarnnn to Claude" guide pointing to the production MCP
  URL, token generation instructions, and smoke tests (`get_substrate`).
- Provide contact details for suspicious-activity reports; Anthropic recommends
  filing through their VDP if something malicious is detected.

Refer back to this note when finalising Claude launch messaging and admin docs.
