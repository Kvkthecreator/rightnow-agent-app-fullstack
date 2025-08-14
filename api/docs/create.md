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

## Parsing Policy v2 (Production Ready)

1. **Text** → Store verbatim, chunk if > CHUNK_LEN (default 30k)
2. **PDF** → Always enabled when PyMuPDF available:
   - **SSRF Protection**: Only processes URLs from ALLOWED_PUBLIC_BASE
   - **Size limit**: PDF_MAX_BYTES (default 20MB)
   - **Timeout**: FETCH_TIMEOUT_SECONDS (default 20s)
   - **Text PDFs**: Extract text via PyMuPDF → chunk → store with metadata
   - **Scanned PDFs**: Gracefully handled as reference with parse_error
   - **Metadata stored**: url, mime, size, parsed (bool), chars_extracted, parse_error
3. **URL** → Not crawled (saved as reference only via frontend text)
4. **Others** → References only with metadata

### Environment Configuration
- `ALLOWED_PUBLIC_BASE`: **Required** - Supabase storage URL prefix for SSRF protection
- `PDF_MAX_BYTES`: Maximum PDF size in bytes (default: 20000000)
- `CHUNK_LEN`: Text chunk size (default: 30000)
- `FETCH_TIMEOUT_SECONDS`: HTTP fetch timeout (default: 20)
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
- Files only fetched from `ALLOWED_PUBLIC_BASE` (required config)
- Configurable timeout via `FETCH_TIMEOUT_SECONDS`
- Content-Type validation and magic byte detection for PDFs
- Size limit enforcement before download

### Error Handling
- **400**: Invalid schema or disallowed URL
- **401**: Missing/invalid authentication
- **413**: File size exceeds `PDF_MAX_BYTES`
- **422**: No usable text to ingest
- **500**: Only for genuine server/DB errors
- PDF parse failures: Soft-fail with metadata, continue processing
- All errors include trace_id for debugging

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

**chunk_text(text: str, max_len: int = 30000) -> List[RawDumpChunk]**
- Splits text into chunks by paragraphs
- Maintains order via `order_index`
- Returns empty list for empty input

**extract_pdf_text(content: bytes) -> str**
- Uses PyMuPDF (fitz) to extract text from PDFs
- Handles byte streams with proper error handling
- Returns empty string for scanned/image PDFs

**SubstrateOps (new)**
- `create_context_block()`: Creates real persisted blocks with IDs
- `create_document()`: Creates documents from processed content
- `update_context_block()`: Updates existing blocks with version control
- `load_basket_substrate()`: Loads existing substrate for evolution

### Route Behavior

**`/api/dumps/new` route**:
1. Validates basket_id and ALLOWED_PUBLIC_BASE
2. Fetches and parses PDFs with timeout and size limits
3. Aggregates all text (user text + PDF content)
4. Chunks if > CHUNK_LEN
5. Stores with `source_meta` and `ingest_trace_id`
6. Returns `raw_dump_id` (single) or `raw_dump_ids` (multiple)

**`/api/baskets/{id}/work` route**:
1. Supports both new mode (init_build/evolve_turn) and legacy
2. Uses hierarchical request_id for idempotency
3. Manager creates real persisted entities via SubstrateOps
4. Returns BasketDelta with actual entity IDs and versions

### Dependencies

- PyMuPDF >= 1.24.0 (added to requirements.txt)
- Feature flag `ENABLE_PDF_V1=1` can guard PDF functionality if needed

## Migration Instructions

1. **Run database migration**:
   ```bash
   cd api
   python run_migrations.py
   ```
   This adds `source_meta` and `ingest_trace_id` columns to raw_dumps.

2. **Set environment variables**:
   ```bash
   export ALLOWED_PUBLIC_BASE="https://your-bucket.supabase.co/storage/v1/object/public/"
   export PDF_MAX_BYTES=20000000
   export FETCH_TIMEOUT_SECONDS=20
   ```

3. **Verify PyMuPDF installation**:
   ```bash
   pip install PyMuPDF>=1.24.0
   ```

## Rollback Commands

```bash
# Revert code changes
git restore --source=origin/main -- api/src/app/routes/dump_new.py
git restore --source=origin/main -- api/src/services/manager.py
git restore --source=origin/main -- api/src/services/substrate_ops.py
git restore --source=origin/main -- web/app/api/baskets/[id]/work/route.ts

# Note: Database changes require manual rollback
```