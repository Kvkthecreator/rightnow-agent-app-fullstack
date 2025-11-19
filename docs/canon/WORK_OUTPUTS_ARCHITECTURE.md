# Work Outputs Architecture Proposal
**Date**: November 19, 2025
**Status**: PROPOSAL (awaiting approval)
**Depends On**: [CLAUDE_SDK_CAPABILITIES.md](CLAUDE_SDK_CAPABILITIES.md)

---

## Problem Statement

Our current `work_outputs` schema only supports **text outputs** (`body` field). After researching Claude Agent SDK capabilities, we discovered:

1. **Skills enable file generation**: PDF, XLSX, DOCX, PPTX, PNG, CSV
2. **ReportingAgentSDK is underutilized**: Only produces text, but can generate professional files
3. **Substrate integration requires file support**: work_outputs → substrate-API needs file transfer

**Current Schema (Insufficient)**:
```sql
CREATE TABLE work_outputs (
    id UUID PRIMARY KEY,
    work_ticket_id UUID,
    output_type TEXT,  -- finding, suggestion, report_draft
    title TEXT,
    body TEXT,  -- ❌ TEXT ONLY
    metadata JSONB,
    source_context_ids UUID[]
);
```

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     WORK OUTPUTS                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐           ┌──────────────┐               │
│  │ TEXT OUTPUTS │           │ FILE OUTPUTS │               │
│  ├──────────────┤           ├──────────────┤               │
│  │ body: TEXT   │           │ file_id: TEXT│               │
│  │ metadata     │           │ file_format  │               │
│  └──────────────┘           │ file_size    │               │
│                             │ mime_type    │               │
│                             │ skill_metadata│               │
│                             └──────────────┘               │
│                                                              │
│  CONSTRAINT: body XOR file_id (mutually exclusive)          │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema (Revised)

```sql
-- Migration: 20251119_work_outputs_file_support.sql

ALTER TABLE work_outputs
  -- File output fields (NEW)
  ADD COLUMN file_id TEXT,
  ADD COLUMN file_format TEXT,
  ADD COLUMN file_size_bytes INTEGER,
  ADD COLUMN mime_type TEXT,

  -- Provenance tracking (NEW)
  ADD COLUMN generation_method TEXT,
  ADD COLUMN skill_metadata JSONB,

  -- Constraint: ONE OF body OR file_id must be set
  ADD CONSTRAINT work_outputs_content_type CHECK (
    (body IS NOT NULL AND file_id IS NULL) OR
    (body IS NULL AND file_id IS NOT NULL)
  );

-- Index for file lookups
CREATE INDEX idx_work_outputs_file_id ON work_outputs(file_id) WHERE file_id IS NOT NULL;

-- Index for generation method analytics
CREATE INDEX idx_work_outputs_generation_method ON work_outputs(generation_method);
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `body` | TEXT | Conditional | Text content (for text outputs) |
| `file_id` | TEXT | Conditional | Claude Files API ID (`file_011CNha...`) |
| `file_format` | TEXT | If file_id set | `pdf`, `xlsx`, `docx`, `pptx`, `png`, `csv` |
| `file_size_bytes` | INTEGER | If file_id set | File size for validation/limits |
| `mime_type` | TEXT | If file_id set | `application/pdf`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, etc. |
| `generation_method` | TEXT | Yes | `text`, `code_execution`, `skill`, `manual` |
| `skill_metadata` | JSONB | Optional | Skill-specific provenance data |

**generation_method Enum**:
- `text`: Standard text output (existing)
- `code_execution`: File generated via code execution tool
- `skill`: File generated via Agent Skill (pdf, xlsx, etc.)
- `manual`: User-uploaded file (future feature)

**skill_metadata Structure**:
```json
{
  "skill_id": "xlsx",
  "skill_name": "Excel Spreadsheet Generator",
  "container_id": "container_abc123",
  "code_executed": "import pandas as pd\n...",
  "execution_time_ms": 1234,
  "skill_version": "latest"
}
```

---

## Output Type Taxonomy (Expanded)

### Text-Based Outputs (Existing)

| output_type | Format | Example Use Case |
|-------------|--------|------------------|
| `finding` | text | Research discoveries |
| `suggestion` | text | Recommendations |
| `report_draft` | text | Written reports (markdown) |

### File-Based Outputs (NEW)

| output_type | Format | Skill | Example Use Case |
|-------------|--------|-------|------------------|
| `report_pdf` | pdf | pdf | Final formatted reports |
| `spreadsheet` | xlsx | xlsx | Data analysis tables |
| `presentation` | pptx | pptx | Slide decks |
| `document` | docx | docx | Formatted documents |
| `chart` | png | code_execution | Data visualizations |
| `dataset` | csv | code_execution | Exported data |

---

## Implementation Plan

### Phase 1: Database Schema Update ✅ (This Session)

**Tasks**:
1. Create migration `20251119_work_outputs_file_support.sql`
2. Apply migration to Supabase
3. Update Python model `work_output.py`
4. Update RLS policies if needed

**Code Changes**:
```python
# models/work_output.py (UPDATED)
class WorkOutput:
    id: UUID
    work_ticket_id: UUID
    output_type: str
    title: str

    # Content (ONE OF)
    body: str | None = None
    file_id: str | None = None

    # File metadata (when file_id is set)
    file_format: str | None = None
    file_size_bytes: int | None = None
    mime_type: str | None = None

    # Provenance
    generation_method: str  # text, code_execution, skill, manual
    skill_metadata: dict | None = None
    metadata: dict
    source_context_ids: list[UUID]
```

### Phase 2: Enable PDF Skill in ReportingAgentSDK (This Session)

**Tasks**:
1. Research how to enable Skills in Python SDK
2. Update `reporting_agent.py` to allow Skills
3. Create test script for PDF generation
4. Validate file_id returned

**Code Changes**:
```python
# yarnnn_agents/reporting_agent.py (UPDATED)
class ReportingAgentSDK:
    def generate_report(
        self,
        topic: str,
        format: str = "text",  # NEW: text, pdf, xlsx, pptx
        sections: list[str] | None = None,
        enable_skills: list[str] | None = None,  # NEW
    ) -> dict:
        """
        Generate a report in specified format.

        Returns:
            For text: {"body": "...", "metadata": {...}}
            For files: {"file_id": "file_...", "format": "pdf", "metadata": {...}}
        """
        if format == "text":
            # Existing text generation
            return self._generate_text_report(topic, sections)
        else:
            # NEW: File generation via Skills
            return self._generate_file_report(topic, format, sections, enable_skills)
```

### Phase 3: Update Work Executor (This Session)

**Tasks**:
1. Update `work_executor.py` to handle file outputs
2. Download file from Claude Files API
3. Store in work_outputs with file metadata

**Code Changes**:
```python
# executors/work_executor.py (UPDATED)
def _emit_work_output(self, output_data: dict):
    if "file_id" in output_data:
        # FILE OUTPUT
        work_output = self.db.create_work_output(
            work_ticket_id=self.work_ticket_id,
            output_type=output_data["output_type"],
            title=output_data["title"],
            file_id=output_data["file_id"],
            file_format=output_data["format"],
            file_size_bytes=output_data.get("file_size"),
            mime_type=output_data.get("mime_type"),
            generation_method="skill",
            skill_metadata=output_data.get("skill_metadata"),
            metadata=output_data.get("metadata", {}),
        )
    else:
        # TEXT OUTPUT (existing)
        work_output = self.db.create_work_output(
            work_ticket_id=self.work_ticket_id,
            output_type=output_data["output_type"],
            title=output_data["title"],
            body=output_data["body"],
            generation_method="text",
            metadata=output_data.get("metadata", {}),
        )
```

### Phase 4: Substrate Integration (Next Session)

**Tasks**:
1. Create Supabase Storage bucket for work_outputs
2. Implement file download from Claude Files API
3. Create substrate-API endpoint `POST /api/work-outputs`
4. Implement BFF adapter in work-platform
5. Test end-to-end file transfer

**Architecture**:
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ Work Platform   │         │  Claude Files   │         │  Substrate API  │
│                 │         │      API        │         │                 │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│                 │         │                 │         │                 │
│ 1. Generate PDF │────────>│ 2. Return       │         │                 │
│    via Skill    │         │    file_id      │         │                 │
│                 │         │                 │         │                 │
│ 3. Download     │────────>│ 4. Send binary  │         │                 │
│    file         │<────────│                 │         │                 │
│                 │         │                 │         │                 │
│ 5. Upload to    │─────────────────────────────────────>│ 6. Store in     │
│    substrate    │         │                 │         │    Supabase     │
│                 │         │                 │         │    Storage      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Code (Pseudocode)**:
```python
# substrate_adapter.py (NEW)
class SubstrateAdapter:
    def upload_work_output(self, work_output: WorkOutput):
        if work_output.file_id:
            # Download from Claude Files API
            file_binary = self.claude_api.download_file(work_output.file_id)

            # Upload to substrate-API
            response = self.substrate_api.post("/api/work-outputs", files={
                "file": (f"{work_output.title}.{work_output.file_format}", file_binary),
                "metadata": json.dumps({
                    "work_ticket_id": str(work_output.work_ticket_id),
                    "output_type": work_output.output_type,
                    "title": work_output.title,
                    "generation_method": work_output.generation_method,
                    "skill_metadata": work_output.skill_metadata,
                })
            })
        else:
            # Text output (existing)
            response = self.substrate_api.post("/api/work-outputs", json={
                "work_ticket_id": str(work_output.work_ticket_id),
                "output_type": work_output.output_type,
                "title": work_output.title,
                "body": work_output.body,
            })
```

---

## Testing Strategy

### Unit Tests

```python
# tests/unit/test_work_output_models.py
def test_work_output_text_only():
    output = WorkOutput(
        output_type="finding",
        title="Research finding",
        body="Some text",
        generation_method="text",
    )
    assert output.body is not None
    assert output.file_id is None

def test_work_output_file_only():
    output = WorkOutput(
        output_type="report_pdf",
        title="Q4 Report",
        file_id="file_011CNha...",
        file_format="pdf",
        generation_method="skill",
    )
    assert output.file_id is not None
    assert output.body is None

def test_work_output_both_body_and_file_raises_error():
    with pytest.raises(ValidationError):
        WorkOutput(
            body="text",
            file_id="file_123",  # ❌ Can't have both
        )
```

### Integration Tests

```python
# tests/integration/test_pdf_generation.py
def test_reporting_agent_pdf_generation():
    agent = ReportingAgentSDK(...)

    result = agent.generate_report(
        topic="Phase 2e Summary",
        format="pdf",
        sections=["Overview", "Architecture", "Testing"],
    )

    assert "file_id" in result
    assert result["format"] == "pdf"
    assert result["file_id"].startswith("file_")

    # Verify file exists in Claude Files API
    file_content = claude_api.download_file(result["file_id"])
    assert len(file_content) > 0
    assert file_content[:4] == b"%PDF"  # PDF magic number
```

---

## Migration Path

### Backward Compatibility

**Existing work_outputs records** (text-only):
- `body` field populated
- `file_id` is NULL
- `generation_method` defaults to `text`
- **No migration needed** (schema is additive)

**New work_outputs records** (files):
- `body` is NULL
- `file_id` populated
- `file_format`, `mime_type`, etc. populated
- `generation_method` = `skill` or `code_execution`

### Rollout Plan

1. **Phase 1**: Apply schema migration (non-breaking)
2. **Phase 2**: Deploy code with file support
3. **Phase 3**: Enable PDF skill for ReportingAgentSDK (opt-in)
4. **Phase 4**: Test file generation end-to-end
5. **Phase 5**: Enable substrate integration
6. **Phase 6**: Expand to XLSX, PPTX skills

---

## Open Questions & Decisions Needed

### 1. File Storage Strategy

**Option A**: Store file_id only (reference Claude Files API)
- ✅ Pro: Simple, no storage overhead
- ❌ Con: Dependent on Claude Files API availability
- ❌ Con: File retention unclear (how long do file_ids remain valid?)

**Option B**: Download and store in Supabase Storage
- ✅ Pro: Full control, permanent storage
- ✅ Pro: Can serve files directly to users
- ❌ Con: Storage costs
- ❌ Con: Additional complexity

**RECOMMENDATION**: **Option B** - Download and store in Supabase Storage
- Justification: Production stability requires ownership of deliverables

### 2. Substrate Integration Pattern

**Option A**: Work Platform downloads + uploads to Substrate
- ✅ Pro: Work Platform owns orchestration
- ❌ Con: Two-hop transfer (Claude → Work → Substrate)

**Option B**: Substrate downloads directly from Claude Files API
- ✅ Pro: One-hop transfer (more efficient)
- ❌ Con: Substrate needs Claude API credentials (cross-domain concern)

**RECOMMENDATION**: **Option A** - Work Platform mediates
- Justification: Work Platform owns work execution, should own deliverable transfer

### 3. File Retention Policy

**Question**: How long should we keep files in work_outputs?

**Options**:
- Keep forever (archive to cold storage after 90 days?)
- Delete after 30 days (keep metadata only)
- User-configurable retention per basket

**RECOMMENDATION**: Defer decision, start with "keep forever"

---

## Success Criteria

### Phase 1 (Schema) ✅
- [ ] Migration applied to Supabase
- [ ] Python model updated
- [ ] Unit tests passing

### Phase 2 (PDF Generation) ✅
- [ ] PDF skill enabled in ReportingAgentSDK
- [ ] Integration test generates PDF successfully
- [ ] file_id returned and validated

### Phase 3 (Work Executor) ✅
- [ ] work_executor handles file outputs
- [ ] work_outputs record created with file metadata
- [ ] End-to-end test: agent → work_output

### Phase 4 (Substrate) 🔜 (Next Session)
- [ ] Supabase Storage bucket created
- [ ] File download from Claude Files API working
- [ ] Substrate-API endpoint implemented
- [ ] End-to-end test: agent → substrate

---

## References

- [CLAUDE_SDK_CAPABILITIES.md](CLAUDE_SDK_CAPABILITIES.md) - SDK research findings
- [PHASE_2E_SESSION_ARCHITECTURE.md](PHASE_2E_SESSION_ARCHITECTURE.md) - Current architecture
- [Claude Files API Docs](https://docs.claude.com/en/docs/build-with-claude/files)
- [Agent Skills Quickstart](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart)

---

**Document Version**: 1.0.0
**Status**: PROPOSAL (awaiting user approval to proceed)
**Next Action**: Review with user, then implement Phase 1
