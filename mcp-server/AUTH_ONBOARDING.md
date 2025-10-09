# YARNNN AI Integrations – Auth & Onboarding Overview

This project assumes the **web application** remains the source of truth for
identity, workspaces, and governance. The MCP adapters act only on behalf of a
user who already has an account.

## 1. Account Creation & Workspace Ownership

1. User signs up at `app.yarnnn.com` (Supabase auth).  
2. On first login, the backend creates the canonical workspace + membership
   (see Auth Canon: single workspace per user).  
3. All governance settings, baskets, and tokens are managed here.

> **No adapter creates users.** If a request arrives without a valid token, the
> adapters return a 401 and surface a CTA to finish onboarding in the web app.

## 2. Integration Credentials

### Anthropic / MCP Clients
- The user visits **Settings → Integrations** in the web UI.  
- YARNNN issues a long-lived integration token (Supabase JWT or dedicated key)
  tied to their workspace.  
- They paste this token into Claude/Cursor `user_token` config.  
- Each MCP request carries the token; the adapter uses `validateAuth` to resolve
  `user_id` and `workspace_id` before calling the backend.

### OpenAI Apps SDK (ChatGPT)
- The web UI exposes a **“Connect ChatGPT”** button.  
- Clicking it starts the OpenAI OAuth flow (Apps SDK requirements).  
- After the callback, YARNNN stores the access/refresh tokens against the
  user’s workspace.  
- When ChatGPT invokes a tool, the adapter loads the saved credentials and acts
  on behalf of that user.

## 3. Request Flow Summary

```
Claude/Cursor → Anthropic adapter → validateAuth(token) → YARNNN backend
ChatGPT Apps → OpenAI adapter → validateAuth(using stored OAuth) → backend
```

Both adapters ultimately call the same `/api/mcp/...` endpoints. The adapters do
not manipulate auth state; they simply enforce that every tool call is tied to a
known workspace.

## 4. Error & UX Handling

- If `validateAuth` fails, return an MCP/App response prompting the user to
  visit `https://yarnnn.com/connect` to generate/link their account.  
- The adapters should never attempt to create a workspace or bypass governance
  defaults.  
- Integration tokens are revokable via the web app. Claude users can simply
  remove the token; OpenAI users can disconnect the app, revoking stored OAuth
  credentials.

## 5. Implementation Checklist (Next Steps)

1. Add an “Integrations” section in the web dashboard to mint/revoke MCP tokens.  
2. Implement OpenAI OAuth endpoints (`/oauth/start`, `/oauth/callback`) and
   store tokens per workspace.  
3. Update the adapters to detect missing tokens and return consistent CTA copy.  
4. Log all adapter requests with `user_id` + `workspace_id` for auditing.

Following this flow keeps identity management centralized while enabling
platform-specific adapters to operate securely on behalf of the user.
