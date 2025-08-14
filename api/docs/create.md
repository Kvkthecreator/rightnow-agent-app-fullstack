# Create Flow - Backend Canon

## Contracts

### /api/dumps/new (v1 - current)
**Method**: POST  
**Payload**: `DumpPayload`
```json
{
  "basket_id": "string",
  "text_dump": "string", 
  "file_urls": ["string"] // optional
}
```
**Response** (always includes both shapes):
```json
{
  "raw_dump_id": "<uuid>",      // First ID for backward compatibility
  "raw_dump_ids": ["<uuid>", ...] // All IDs (includes the first)
}
```

### /api/baskets/{id}/work
**Method**: POST  
**Payload**: `BasketWorkRequest` (new) or `BasketChangeRequest` (legacy)

**New Format (BasketWorkRequest)**:
```json
{
  "mode": "init_build" | "evolve_turn",
  "sources": [
    {"type": "raw_dump", "id": "<uuid>"}
  ],
  "policy": {
    "allow_structural_changes": true,
    "preserve_blocks": ["block_id_1"],
    "update_document_ids": ["doc_id_1"],
    "strict_link_provenance": true
  },
  "options": {
    "fast": false,
    "max_tokens": 8000,
    "trace_req_id": "optional_trace_id"
  }
}
```

**Legacy Format (BasketChangeRequest)**:
```json
{
  "request_id": "string",
  "basket_id": "string",
  "sources": [
    {"type": "raw_dump", "id": "<uuid>"}
  ],
  "intent": "string", // optional
  "agent_hints": ["string"], // optional
  "user_context": {} // optional
}
```

### /api/baskets/{id}/narrative/jobs
**Method**: POST  
**Payload**: `NarrativeJobRequest`
```json
{
  "mode": "from_scaffold" | "refresh_full",
  "include": ["blocks", "context", "documents", "raw_dumps"]
}
```
**Response**:
```json
{
  "job_id": "job_narr_abc123"
}
```

### /api/jobs/{job_id}
**Method**: GET  
**Response**:
```json
{
  "state": "queued" | "running" | "done" | "error",
  "progress": 85,
  "narrative": {
    "title": "Generated Narrative",
    "content": "...",
    "sections": [...]
  }
}
```

## Work Modes

### init_build
- **Purpose**: Initialize basket with fresh substrate from raw sources
- **Input**: Raw dumps, text sources
- **Process**: Interpret dumps → create substrate → persist → promote basket
- **Output**: Scaffold with counts (raw_dumps, blocks, context_items, documents, links)
- **Events**: Emits `ingest.completed`

### evolve_turn
- **Purpose**: Evolve existing basket with new sources
- **Input**: New sources + existing substrate
- **Process**: Load existing → cross-analyze → compute deltas → persist
- **Output**: Delta summary with added/updated/removed counts
- **Events**: Emits `evolve.completed`
- **Policy**: Respects `preserve_blocks`, `update_document_ids`

## Narrative Jobs

### from_scaffold
- **Purpose**: Generate narrative from fresh substrate (for new baskets)
- **Process**: Read substrate from DB → generate narrative
- **Use case**: After `init_build` completes

### refresh_full
- **Purpose**: Regenerate narrative with latest data (for existing baskets)
- **Process**: Refetch all requested types → generate narrative
- **Use case**: User requests updated narrative

## Parsing Policy v1

1. **Text** → Store verbatim, chunk if > CHUNK_LEN (default 30k)
2. **PDF** → When ENABLE_PDF_V1=1:
   - Only processes Supabase public URLs (ALLOWED_PUBLIC_BASE)
   - Size limit: PDF_MAX_BYTES (default 20MB)
   - Text-based PDFs: extract text via PyMuPDF → chunk
   - Scanned PDFs: remain as reference links only
3. **URL** → Not crawled (saved as reference only via frontend text)
4. **Others** → References only

### Environment Configuration
- `ENABLE_PDF_V1`: "1" to enable PDF parsing (default: "0")
- `PDF_MAX_BYTES`: Maximum PDF size in bytes (default: 20000000)
- `CHUNK_LEN`: Text chunk size (default: 30000)
- `ALLOWED_PUBLIC_BASE`: Required Supabase storage URL prefix for SSRF protection
- `NARRATIVE_JOBS_ENABLED`: "true" to enable narrative jobs API (default: "false")

## Sequence

```
1. Create/resolve basket
2. Normalize inputs (text + file URLs)
3. Parse content (server-side via ingestion module):
   - Chunk text if > CHUNK_LEN
   - If PDF enabled: fetch allowed PDFs → extract → chunk
   - If no content: create reference dump with links
4. Write raw_dumps (one per chunk, file_refs on first only)
5. Log single event with all dump_ids and workspace_id
6. Return both raw_dump_id and raw_dump_ids
7. Frontend: POST /api/baskets/{id}/work with mode=init_build and all dump IDs
8. Manager: Process init_build → create substrate → return scaffold
9. Frontend: Redirect to basket view
10. (Async) POST /api/baskets/{id}/narrative/jobs with mode=from_scaffold
11. Poll /api/jobs/{job_id} until narrative generation complete
```

## Events & Trace IDs

- **X-Req-Id**: Flows through all layers (frontend → proxy → backend → manager → agents)
- **Event Types**:
  - `dump.created`: Raw dumps inserted
  - `ingest.completed`: Initial substrate build finished
  - `evolve.completed`: Incremental changes applied
  - `narrative_job.started/completed/failed`: Async narrative generation
- **Event Payload**: Always includes `basket_id`, `workspace_id`, `req_id`

## Idempotency & Request Deduplication

For `/api/baskets/{id}/work` requests, the system uses a hierarchical approach to generate `request_id`:

1. **First priority**: `options.trace_req_id` from request body (enables explicit deduplication)
2. **Second priority**: `X-Req-Id` header (enables retry deduplication)
3. **Fallback**: Generated UUID (`work_{8-char-hex}`)

This ensures retries with the same trace ID or header are safely deduplicated, returning the cached delta instead of reprocessing.

## Single Source of Truth

- **Parsing & substrate**: Backend responsibilities (api/src/app/ingestion/)
- **Frontend**: Never writes DB directly (except basket create via trusted route)
- **Auth**: Frontend always goes through Next proxy for auth/workspace headers
- **Request tracking**: X-Req-Id header flows through all layers for debugging

## Security & Reliability

### SSRF Protection
- PDFs only fetched from `ALLOWED_PUBLIC_BASE` (Supabase public storage)
- 10-second timeout on PDF fetches
- Content-Type validation (must contain "pdf")
- Streaming with size limit enforcement

### Error Handling
- PDF fetch failures: soft-fail, keep URL as reference
- Size limit exceeded: HTTPException(413, "PDF too large")
- Empty content: creates single reference dump
- All errors logged with X-Req-Id when present

## Implementation Details

### Ingestion Module Structure
```
api/src/app/ingestion/
├── __init__.py
├── types.py           # ParseResult, RawDumpChunk models
├── pipeline.py        # chunk_text() function
└── parsers/
    ├── __init__.py
    └── pdf_text.py    # extract_pdf_text() using PyMuPDF
```

### Key Functions

**chunk_text(text: str, max_len: int = 6000) -> List[RawDumpChunk]**
- Splits text into chunks by paragraphs
- Maintains order via `order_index`
- Returns empty list for empty input

**extract_pdf_text(path_or_bytes) -> str**
- Uses PyMuPDF (fitz) to extract text from PDFs
- Handles both file paths and byte streams
- Returns empty string for scanned/image PDFs

### Route Behavior

The `/api/dumps/new` route:
1. Validates basket_id (no null)
2. Chunks text if > 30k characters
3. For single chunk: returns `raw_dump_id`
4. For multiple chunks: returns `raw_dump_ids` array
5. Maintains backward compatibility with existing frontend

### Dependencies

- PyMuPDF >= 1.24.0 (added to requirements.txt)
- Feature flag `ENABLE_PDF_V1=1` can guard PDF functionality if needed

## Rollback Commands

```bash
git restore --source=origin/main -- api/src/app/ingestion
git restore --source=origin/main -- api/src/app/routes/dump_new.py
git restore --source=origin/main -- api/docs/create.md
git restore --source=origin/main -- api/requirements.txt
```