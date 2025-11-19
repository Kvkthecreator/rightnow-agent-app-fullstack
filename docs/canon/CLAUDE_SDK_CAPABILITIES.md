# Claude Agent SDK Capabilities & Output Architecture
**Research Date**: November 19, 2025
**Purpose**: Understand Claude SDK capabilities to design work_outputs architecture

---

## Executive Summary

The Claude Agent SDK provides **three distinct output mechanisms**:

1. **Text Outputs**: Standard conversational responses (current implementation)
2. **File Outputs**: Generated files (PDF, XLSX, DOCX, PPTX) via code execution
3. **Skill-Enhanced Outputs**: Structured deliverables using Agent Skills

**Critical Finding**: Our current `work_outputs` schema (text-only) is insufficient. We need to support binary files, file metadata, and skill provenance tracking.

---

## 1. Core SDK Capabilities

### 1.1 Context Management
- Automatic context compaction to prevent running out of context
- Built-in prompt caching and optimization
- Session persistence via `sdk_session_id` (already implemented in Phase 2e)

### 1.2 Tool Ecosystem
- **Built-in Tools**: File operations (Read, Write, Edit), code execution, web search
- **MCP Servers**: Custom tool integration for databases and APIs
- **Agent Skills**: Pre-built capabilities for file generation and domain expertise

### 1.3 Permission Controls
- Fine-grained tool access via `allowedTools`, `disallowedTools`
- Skill-specific permissions (e.g., only allow PDF generation, not code execution)

---

## 2. Agent Skills Architecture

### 2.1 What Are Skills?

**Skills are NOT executable code**. They are:
- Markdown-based instruction sets (`SKILL.md`)
- Context modification and prompt injection systems
- Progressive disclosure mechanisms

**Key Quote**: "Skills are not executable code. They do NOT run Python or JavaScript."

### 2.2 Progressive Disclosure Model

Skills use a 3-tier loading system:

```
Level 1: Metadata (always loaded)
  ├─ name: "pdf_generator"
  └─ description: "Generate PDF documents"

Level 2: Instructions (loaded when triggered)
  └─ Full SKILL.md content

Level 3: Resources (loaded as needed)
  ├─ scripts/ (Python/Bash automation)
  ├─ references/ (documentation)
  └─ assets/ (templates, binaries)
```

**Benefit**: "The amount of context that can be bundled into a skill is effectively unbounded."

### 2.3 Anthropic-Provided Skills

Four pre-built file generation skills:

| Skill ID | Capability | Output Format |
|----------|-----------|---------------|
| `pptx` | Create/edit presentations | PowerPoint (.pptx) |
| `xlsx` | Create/analyze spreadsheets | Excel (.xlsx) |
| `docx` | Create/edit documents | Word (.docx) |
| `pdf` | Generate PDF documents | PDF (.pdf) |

### 2.4 Custom Skills

**Structure**:
```
my-skill/
├── SKILL.md           # Core prompt with YAML frontmatter
├── scripts/           # Python/Bash automation
├── references/        # Documentation (markdown)
└── assets/            # Templates and binaries
```

**SKILL.md Frontmatter** (YAML):
```yaml
name: "custom_skill_name"
description: "What the skill does"
allowed-tools: "Read,Write,Bash,Glob,Grep,Edit"
license: "MIT"
version: "1.0.0"
model: "claude-sonnet-4.5"  # Optional model override
```

**Installation**: Place in `.claude/skills/` directory

---

## 3. File Generation Mechanisms

### 3.1 How Files Are Created

Skills **guide Claude to write code** that generates files. The workflow:

```
1. User Request
   ↓
2. Agent loads relevant Skill (e.g., "xlsx")
   ↓
3. Skill provides instructions + templates
   ↓
4. Claude writes Python/Node.js code
   ↓
5. Code execution tool runs in sandbox
   ↓
6. Files created in sandbox filesystem
   ↓
7. File IDs returned in API response
```

**Key Quote**: "Claude's file creation feature relies entirely on code generation - Claude writes Python scripts to create Excel spreadsheets, PowerPoint presentations, and Word documents."

### 3.2 Code Execution Tool

**API Setup**:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "anthropic-beta: code-execution-2025-05-22" \
  --data '{
    "tools": [
      {
        "type": "code_execution_20250522",
        "name": "code_execution"
      }
    ]
  }'
```

**Response Structure** (includes file references):
```json
{
  "content": [
    {
      "type": "tool_use",
      "name": "code_execution",
      "input": {
        "code": "...",
        "language": "python"
      }
    }
  ],
  "container": {
    "id": "container_abc123",
    "files": ["file_011CNha8iCJcU1wXNR6q4V8w"]
  }
}
```

### 3.3 Files API - Downloading Generated Files

**Critical Constraint**: You can ONLY download files created by Skills or code execution. Uploaded files cannot be downloaded.

**Download Endpoint**:
```bash
curl -X GET "https://api.anthropic.com/v1/files/{file_id}/content" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: files-api-2025-04-14" \
  --output downloaded_file.pdf
```

**File Size Limit**: 30MB per file (uploads and downloads)

**File ID Format**: `file_011CNha8iCJcU1wXNR6q4V8w` (returned in API response)

---

## 4. Output Types & Structure

### 4.1 Current Implementation (Text Only)

```python
# work_outputs table (current)
work_outputs = {
    "id": UUID,
    "work_ticket_id": UUID,
    "output_type": "finding" | "suggestion" | "report_draft",
    "title": str,
    "body": str,  # ❌ TEXT ONLY - INSUFFICIENT!
    "metadata": JSONB,
    "created_at": timestamp
}
```

### 4.2 Required Output Architecture (File Support)

```python
# work_outputs table (PROPOSED)
work_outputs = {
    "id": UUID,
    "work_ticket_id": UUID,
    "output_type": str,  # finding, suggestion, report_draft, file_output
    "title": str,

    # TEXT OUTPUTS (existing)
    "body": str | None,  # For text-based outputs

    # FILE OUTPUTS (NEW)
    "file_id": str | None,  # Claude Files API ID (file_011CNha...)
    "file_format": str | None,  # pdf, xlsx, docx, pptx, png, csv
    "file_size_bytes": int | None,
    "mime_type": str | None,  # application/pdf, etc.

    # METADATA & PROVENANCE
    "metadata": JSONB,  # Existing flexible metadata
    "skill_metadata": JSONB | None,  # NEW: Skill-specific data
    "generation_method": str,  # text, code_execution, skill, manual

    # EXISTING FIELDS
    "source_context_ids": UUID[],
    "created_at": timestamp,
    "updated_at": timestamp
}
```

**skill_metadata Structure**:
```json
{
  "skill_id": "xlsx",
  "skill_name": "Excel Spreadsheet Generator",
  "container_id": "container_abc123",
  "code_executed": "import pandas as pd...",
  "execution_time_ms": 1234
}
```

### 4.3 Output Type Taxonomy

| Category | Output Type | Format | Example Use Case |
|----------|------------|--------|------------------|
| **Text** | `finding` | text | Research discoveries |
| **Text** | `suggestion` | text | Recommendations |
| **Text** | `report_draft` | text | Written reports |
| **File** | `spreadsheet` | xlsx | Data analysis tables |
| **File** | `presentation` | pptx | Slide decks |
| **File** | `document` | docx | Formatted documents |
| **File** | `report_pdf` | pdf | Final deliverables |
| **File** | `chart` | png | Data visualizations |
| **File** | `dataset` | csv | Exported data |

---

## 5. Integration with Current Architecture

### 5.1 Phase 2e Architecture (Current)

```
agent_sessions (persistent Claude SDK sessions)
  ↓ 1:N
work_requests (user asks)
  ↓ 1:1
work_tickets (execution tracking)
  ↓ 1:N
work_outputs (deliverables)  ← NEEDS FILE SUPPORT
```

### 5.2 Agent Execution Flow with Files

```python
# ResearchAgentSDK.deep_dive() - Current
result = agent.deep_dive(task="Research Claude Sessions")
# Returns: List[Dict] with text findings

# ReportingAgentSDK.generate_report() - FUTURE
result = agent.generate_report(
    topic="Q4 Metrics",
    format="pdf",  # NEW: Specify output format
    enable_skills=["xlsx", "pdf"]  # NEW: Enable Skills
)
# Returns: {
#   "file_id": "file_011CNha...",
#   "format": "pdf",
#   "metadata": {...}
# }
```

### 5.3 Work Platform → Substrate Integration

**Critical Workflow**:
```
1. Agent generates file (PDF report)
   ├─ Claude SDK creates file in sandbox
   ├─ Returns file_id: "file_011CNha..."
   └─ work_outputs record created

2. Work Platform downloads file
   ├─ GET /v1/files/{file_id}/content
   └─ Store binary in memory

3. Work Platform → Substrate BFF
   ├─ POST /api/work-outputs (substrate-API)
   ├─ Multipart upload: metadata + file binary
   └─ Substrate stores in Supabase Storage

4. Substrate stores file
   ├─ Upload to Supabase Storage bucket
   ├─ Generate public URL
   └─ Link to context_block or keep separate
```

---

## 6. Reporting Agent - High Leverage Opportunity

### 6.1 Current Capabilities (Underutilized)

The ReportingAgentSDK currently only produces **text outputs**, but Skills unlock:

- **PDF Reports**: Professional formatted documents
- **Excel Spreadsheets**: Data tables with formulas
- **PowerPoint Decks**: Visual presentations
- **Charts/Graphs**: Data visualizations (PNG)

### 6.2 Proposed Enhancement Path

**Phase 1**: Enable PDF skill
```python
# reporting_agent.py
class ReportingAgentSDK:
    def __init__(self, ...):
        self.allowed_tools = ["Read", "Write", "Bash", "Skill"]  # NEW
        self.enabled_skills = ["pdf"]  # NEW
```

**Phase 2**: Test PDF generation
```python
# Test script
report = reporting_agent.generate_report(
    topic="Phase 2e Implementation Summary",
    format="pdf",
    sections=["Overview", "Architecture", "Testing"]
)
# Expect: file_id returned
```

**Phase 3**: Integrate with work_outputs
```python
# executor.py
file_metadata = {
    "file_id": report["file_id"],
    "file_format": "pdf",
    "skill_metadata": {...}
}
work_output = self.db.create_work_output(
    output_type="report_pdf",
    file_id=file_metadata["file_id"],
    ...
)
```

**Phase 4**: Push to substrate-API
```python
# substrate_adapter.py
file_content = self.claude_api.download_file(file_id)
self.substrate_api.upload_work_output(
    metadata=work_output,
    file_binary=file_content
)
```

---

## 7. Recommendations

### 7.1 Immediate Actions (This Session)

1. ✅ **Test reorganization** (DONE)
2. **Update work_outputs schema** (add file support)
3. **Enable PDF skill** in ReportingAgentSDK
4. **Test end-to-end PDF generation**

### 7.2 Next Session

1. **Implement substrate-API file upload endpoint**
2. **Configure Supabase Storage bucket**
3. **Test work_outputs → substrate integration**
4. **Expand to XLSX/PPTX skills**

### 7.3 Architecture Decision

**Recommended Approach**: File-first design

```python
# work_outputs schema (FINAL RECOMMENDATION)
CREATE TABLE work_outputs (
    id UUID PRIMARY KEY,
    work_ticket_id UUID REFERENCES work_tickets(id),
    output_type TEXT NOT NULL,
    title TEXT NOT NULL,

    -- FLEXIBLE CONTENT (ONE OF):
    body TEXT,  -- For text outputs
    file_id TEXT,  -- For file outputs (Claude Files API ID)

    -- FILE METADATA (when file_id is set)
    file_format TEXT,  -- pdf, xlsx, docx, pptx, png, csv
    file_size_bytes INTEGER,
    mime_type TEXT,

    -- PROVENANCE & METADATA
    generation_method TEXT,  -- text, code_execution, skill
    skill_metadata JSONB,
    metadata JSONB,
    source_context_ids UUID[],

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    CHECK (
        (body IS NOT NULL AND file_id IS NULL) OR
        (body IS NULL AND file_id IS NOT NULL)
    )
)
```

---

## 8. References

### Official Documentation
- [Claude Agent SDK Overview](https://docs.claude.com/en/docs/agent-sdk/overview)
- [Agent Skills Quickstart](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/quickstart)
- [Files API Documentation](https://docs.claude.com/en/docs/build-with-claude/files)
- [Messages API](https://docs.claude.com/en/api/messages)

### Technical Deep Dives
- [Claude Agent Skills: A First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Equipping Agents for the Real World with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

### API Headers Required
```bash
# Code Execution
anthropic-beta: code-execution-2025-05-22

# Files API
anthropic-beta: files-api-2025-04-14

# Skills (inferred)
anthropic-beta: skills-2025-XX-XX  # TBD
```

---

## 9. Open Questions

1. **Skills in Python SDK**: How to enable Skills programmatically? (Not documented clearly)
2. **File persistence**: How long do file_ids remain valid?
3. **Skill versioning**: Can we pin specific skill versions?
4. **Custom skills in production**: Deployment process?
5. **File metadata**: Is there a Files API endpoint to get metadata without downloading?

---

**Document Version**: 1.0.0
**Last Updated**: November 19, 2025
**Next Review**: After implementing file support in work_outputs
