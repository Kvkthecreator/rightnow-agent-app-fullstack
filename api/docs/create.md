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
**Response**:
- Single dump: `{"raw_dump_id": "<uuid>"}`
- Multiple dumps (chunked): `{"raw_dump_ids": ["<uuid>", ...]}`

### /api/baskets/{id}/work
**Method**: POST  
**Payload**: `BasketChangeRequest`
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

## Parsing Policy v1

1. **Text** → Store verbatim, chunk if > ~30k characters
2. **PDF** → Try `extract_pdf_text`; if empty → mark ref_only (no raw_dump)
3. **URL** → Not crawled (saved as reference only via frontend text)
4. **Others** → References only

## Sequence

```
1. Create/resolve basket
2. Normalize inputs
3. Parse content (server-side via ingestion module)
4. Write raw_dumps (chunked if needed)
5. Trigger work/ingest via POST /api/baskets/{id}/work
6. Consolidate results
7. Return response
8. (Async) Run narrative agents
```

## Single Source of Truth

- **Parsing & substrate**: Backend responsibilities (api/src/app/ingestion/)
- **Frontend**: Never writes DB directly (except basket create via trusted route)
- **Auth**: Frontend always goes through Next proxy for auth/workspace headers

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