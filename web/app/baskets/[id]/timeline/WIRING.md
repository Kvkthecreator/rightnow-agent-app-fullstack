# /baskets/[id]/timeline – Wiring

Data Flow
- GET /api/baskets/:id/timeline -> TimelineDTO

SWR Keys / Invalidation (if SWR used)
- No SWR used (server-side fetch with no-store cache)

Contracts
- TimelineDTO (append-only stream with filters)

Components
- TimelinePage (renders timeline activity stream)
- Timeline event cards with activity summaries