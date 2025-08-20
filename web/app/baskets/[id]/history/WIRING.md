# /baskets/[id]/history – Wiring

Data Flow
- TODO: GET /api/baskets/:id/history?cursor= -> HistoryPage

SWR Keys / Invalidation (if SWR used)
- No SWR used yet (skeleton page)

Contracts
- HistoryPage (append-only stream with filters)

Components
- HistoryPage (skeleton - TODO: implement history stream)
- TODO: Event timeline component
- TODO: Filter and search components
- TODO: Pagination/cursor handling