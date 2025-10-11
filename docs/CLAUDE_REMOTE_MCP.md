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
- Open Claude chat, click the **Search & tools** icon (bottom-right).
- Under the **Custom** section, toggle Yarnnn → Claude prompts for the bearer
  token. Paste the integration token created in Yarnnn and save.
- After the toggle succeeds, Settings → Connectors shows Yarnnn as Connected.

## Troubleshooting
- **No Connect panel:** Claude must reach the server over WebSocket (`wss://...`). Use the browser console to look for `WebSocket connection failed` errors; check the response headers at `https://mcp.yarnnn.com/sse` to ensure `Upgrade: websocket` and `Access-Control-Allow-Origin: *` are present.
- **Bearer prompt missing:** sign out/in, or try Claude Desktop. Occasionally the web client fails to render the dialog until a new chat is created.
- **Token rejected:** the MCP server logs `401` errors if the integration token is invalid or revoked; confirm the exact token matches the one in Yarnnn.

## Security Reminders (Anthropic guidance)
- Remote MCP servers are unverified; remind users to only connect to Yarnnn’s
  official endpoint and to review tool invocation prompts before approving.
- Write-capable tools should remain disabled unless the user intends to use
  them; Yarnnn surfaces confirmation copy for writes to help with this.
- Research mode can auto-invoke tools; document recommended settings (e.g.
  disable write actions during Research sessions).

## Removal / Editing
- Remove or edit the connector from **Settings → Connectors** via the menu
  next to Yarnnn.

## Support Playbook
- Publish an “Add Yarnnn to Claude” guide linking to the production MCP URL and
  showing where to locate the token prompt (Search & tools → Yarnnn toggle).
- Provide contact details for suspicious-activity reports; Anthropic recommends
  filing through their VDP if something malicious is detected.

Refer back to this note when finalising Claude launch messaging and admin docs.
