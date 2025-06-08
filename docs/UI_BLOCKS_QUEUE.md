# UI Design — Blocks and Queue

These pages are technical surfaces for managing reusable context.

## `/blocks`
- Shows all context blocks created by agents, users, or onboarding
- Visual labels by scope (basket, profile, agent, etc)
- Intended for debugging and advanced editing

## `/queue`
- Lists agent-suggested updates
- Each entry shows block label and proposed change
- Entries include scope (source_scope) to guide user review

## Sidebar
- Blocks and Queue now grouped under "Advanced"
- Can be hidden or toggled via environment variable
