# Auth & Workspace Structure

This document outlines how authentication ties into workspace management in the app. Every user belongs to a workspace. When creating baskets or blocks, the workspace_id is required so that row-level security can enforce membership rules.

## 🔍 Debugging Tips

- Check console logs for `[WorkspaceCheck]`, `[BasketLoader]`, etc.
- If basket load fails, inspect:
  - session (user exists?)
  - workspace_id (valid? matches data?)
  - RLS policy (does user belong to workspace?)
