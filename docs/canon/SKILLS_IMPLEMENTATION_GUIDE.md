# Claude Agent SDK Skills: Implementation Guide
**Date**: November 19, 2025
**Source**: [claude-cookbooks/skills](https://github.com/anthropics/claude-cookbooks/tree/b29ec6f109c0379fa2eb620611a3d504e28fba09/skills)
**Purpose**: Technical reference for implementing Skills in YARNNN agents

---

## 1. Skills Setup (Python SDK)

### Required Beta Headers

```python
from anthropic import Anthropic

client = Anthropic(
    api_key="your-anthropic-api-key",
    default_headers={
        "anthropic-beta": "code-execution-2025-08-25,files-api-2025-04-14,skills-2025-10-02"
    }
)
```

**Three beta headers are mandatory**:
1. `code-execution-2025-08-25` — Activates skill execution capabilities
2. `files-api-2025-04-14` — Enables file retrieval functionality
3. `skills-2025-10-02` — Unlocks the Skills feature itself

---

## 2. Skill Invocation Pattern

### Basic Invocation

```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",  # Latest model
    max_tokens=4096,

    # SKILLS SPECIFICATION
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },

    # REQUIRED: Code execution tool must be present
    tools=[
        {"type": "code_execution_20250825", "name": "code_execution"}
    ],

    messages=[
        {"role": "user", "content": "Create an Excel file with Q4 sales data"}
    ]
)
```

### Built-in Skill IDs

| skill_id | Capability | Output Format | Example Use Case |
|----------|-----------|---------------|------------------|
| `xlsx` | Excel workbook creation | `.xlsx` | Data tables, formulas, charts |
| `pptx` | PowerPoint presentations | `.pptx` | Slide decks, presentations |
| `pdf` | PDF document generation | `.pdf` | Reports, formatted documents |
| `docx` | Word documents | `.docx` | Written content, formatting |

### Multiple Skills in Single Request

```python
container={
    "skills": [
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pdf", "version": "latest"},
    ]
}
```

**Benefit**: Claude can decide which skill to use based on user intent.

---

## 3. File Output Handling

### Response Structure

Skills return `file_id` attributes embedded in response blocks:

```python
response = client.messages.create(...)

# Response structure:
# response.content = [
#     ContentBlock(type="text", text="I've created the Excel file..."),
#     ContentBlock(
#         type="tool_use",
#         id="toolu_...",
#         name="code_execution",
#         input={...}
#     ),
#     ContentBlock(
#         type="tool_result",
#         tool_use_id="toolu_...",
#         content=[...],  # Contains file_id reference
#     )
# ]
```

### Extracting file_id from Response

```python
def extract_file_ids(response):
    """Extract all file_ids from Claude response"""
    file_ids = []

    for block in response.content:
        if block.type == "tool_result":
            # file_id may be in different formats depending on response structure
            content = str(block.content) if hasattr(block, 'content') else str(block)

            # Pattern: file_01AbCdEfGhIjKl...
            import re
            matches = re.findall(r'file_[A-Za-z0-9]{22}', content)
            file_ids.extend(matches)

    return list(set(file_ids))  # Deduplicate
```

### Downloading Files via Files API

```python
# Method 1: Download file content
file_content = client.beta.files.download(file_id="file_01AbCdEf...")

# IMPORTANT: Use .read() method, not .content attribute
with open("output.xlsx", "wb") as f:
    f.write(file_content.read())  # ✅ Correct

# ❌ WRONG: file_content.content will fail
```

### Retrieving File Metadata

```python
# Get metadata without downloading full file
metadata = client.beta.files.retrieve_metadata(file_id="file_01AbCdEf...")

# Available attributes:
# - metadata.id: file_01AbCdEf...
# - metadata.filename: "sales_report.xlsx"
# - metadata.size_bytes: 45231  # ✅ Use size_bytes, not size
# - metadata.created_at: "2025-11-19T..."
```

### Files API Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `client.beta.files.download(file_id)` | Download binary content | File stream (use `.read()`) |
| `client.beta.files.retrieve_metadata(file_id)` | Get metadata | Filename, size_bytes, created_at |
| `client.beta.files.list()` | List all files | Array of file metadata |
| `client.beta.files.delete(file_id)` | Remove file | Deletion confirmation |

---

## 4. Complete Example: Generate & Download Excel File

```python
from anthropic import Anthropic
import re

# Initialize client with Skills support
client = Anthropic(
    api_key="sk-ant-...",
    default_headers={
        "anthropic-beta": "code-execution-2025-08-25,files-api-2025-04-14,skills-2025-10-02"
    }
)

# Request Excel generation
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },
    tools=[
        {"type": "code_execution_20250825", "name": "code_execution"}
    ],
    messages=[
        {
            "role": "user",
            "content": """Create an Excel spreadsheet with:
            - Sheet 1: Sales data (columns: Month, Revenue, Expenses)
            - Sheet 2: Chart showing revenue trends
            - Include formulas for totals"""
        }
    ]
)

# Extract file_id
file_ids = []
for block in response.content:
    if block.type == "tool_result":
        matches = re.findall(r'file_[A-Za-z0-9]{22}', str(block.content))
        file_ids.extend(matches)

if file_ids:
    file_id = file_ids[0]

    # Get metadata
    metadata = client.beta.files.retrieve_metadata(file_id=file_id)
    print(f"Filename: {metadata.filename}")
    print(f"Size: {metadata.size_bytes} bytes")

    # Download file
    file_content = client.beta.files.download(file_id=file_id)

    # Save locally
    with open(f"outputs/{metadata.filename}", "wb") as f:
        f.write(file_content.read())

    print(f"✅ File saved: outputs/{metadata.filename}")
else:
    print("❌ No file_id found in response")
```

---

## 5. Integration with YARNNN Work Orchestration

### work_outputs Schema Integration

```python
from models.work_output import WorkOutput

# After generating file via Skill
file_id = extract_file_ids(response)[0]
metadata = client.beta.files.retrieve_metadata(file_id=file_id)

# Create work_output record
work_output = WorkOutput(
    work_ticket_id=work_ticket_id,
    basket_id=basket_id,
    agent_type="reporting",
    output_type="spreadsheet",
    title="Q4 Sales Analysis",

    # FILE OUTPUT (not text)
    body=None,
    file_id=file_id,
    file_format="xlsx",
    file_size_bytes=metadata.size_bytes,
    mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    # PROVENANCE
    generation_method="skill",
    skill_metadata={
        "skill_id": "xlsx",
        "skill_name": "Excel Spreadsheet Generator",
        "skill_version": "latest",
        "container_id": response.container.id if hasattr(response, 'container') else None,
        "execution_time_ms": calculate_execution_time(response),
    },

    # OPTIONAL: Download and store in Supabase Storage
    storage_path=None,  # Set after uploading to storage
)

db.create_work_output(work_output)
```

### Optional: Persist to Supabase Storage

```python
# Download file from Claude Files API
file_content = client.beta.files.download(file_id=file_id)

# Upload to Supabase Storage
storage_path = f"baskets/{basket_id}/work_outputs/{work_ticket_id}/{metadata.filename}"

supabase.storage.from_("work-outputs").upload(
    path=storage_path,
    file=file_content.read(),
    file_options={"content-type": work_output.mime_type}
)

# Update work_output with storage_path
work_output.storage_path = storage_path
db.update_work_output(work_output)
```

---

## 6. Best Practices & Gotchas

### Critical Implementation Details

1. **Files are temporary on Anthropic servers**
   - Download and save locally/to Supabase Storage immediately
   - File retention period is undocumented (assume short-lived)

2. **Use correct attribute names**
   - ✅ `.read()` method when downloading
   - ❌ NOT `.content` attribute
   - ✅ `size_bytes` property for file metadata
   - ❌ NOT `size`

3. **Code execution tool is REQUIRED**
   - Skills don't work without `code_execution` tool
   - Skills guide Claude to write code → code tool executes → files generated

4. **Progressive disclosure optimization**
   - Skills load dynamically only when invoked
   - Avoids unnecessary token overhead
   - Multiple skills in same request = Claude chooses best one

5. **Rerunning overwrites files**
   - Watch for `[overwritten]` indicators in responses
   - Each run creates new file_id

### Token Optimization

**Batch operations** for efficiency:
```python
# ✅ Good: Single request, multiple outputs
messages=[{
    "role": "user",
    "content": """Create:
    1. Excel file with data
    2. PDF report summarizing the data
    3. PowerPoint presentation with key findings"""
}]

# ❌ Wasteful: Three separate requests
# (loses conversation context, uses more tokens)
```

### Error Handling

```python
try:
    response = client.messages.create(...)
    file_ids = extract_file_ids(response)

    if not file_ids:
        # Skill may have failed or not generated file
        print("Warning: No file generated")
        # Fall back to text output

    for file_id in file_ids:
        try:
            metadata = client.beta.files.retrieve_metadata(file_id=file_id)
            file_content = client.beta.files.download(file_id=file_id)
            # Process file...
        except Exception as e:
            print(f"Error downloading {file_id}: {e}")
            # Continue with other files

except Exception as e:
    print(f"Skill invocation failed: {e}")
    # Handle gracefully
```

---

## 7. Custom Skills (Future)

**Structure**:
```
.claude/skills/my-custom-skill/
├── SKILL.md              # Instructions (YAML frontmatter + markdown)
├── scripts/              # Python/Bash automation
├── references/           # Documentation
└── assets/               # Templates, binaries
```

**SKILL.md Format**:
```markdown
---
name: "custom_skill_name"
description: "What the skill does"
allowed-tools: "Read,Write,Bash,Glob,Grep,Edit"
license: "MIT"
version: "1.0.0"
model: "claude-sonnet-4.5"  # Optional
---

# Skill Instructions

When the user asks for [specific task], do the following:

1. [Step 1]
2. [Step 2]
...
```

**Note**: Custom skills not yet implemented in YARNNN. Start with Anthropic-provided skills (PDF, XLSX, DOCX, PPTX).

---

## 8. Next Steps for YARNNN Integration

### Phase 1: Enable Skills in ReportingAgentSDK ✅

```python
# yarnnn_agents/reporting_agent.py
class ReportingAgentSDK:
    def __init__(self, ...):
        self.client = Anthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            default_headers={
                "anthropic-beta": "code-execution-2025-08-25,files-api-2025-04-14,skills-2025-10-02"
            }
        )

    def generate_report(self, topic: str, format: str = "text", ...):
        if format in ["pdf", "xlsx", "docx", "pptx"]:
            return self._generate_file_output(topic, format, ...)
        else:
            return self._generate_text_output(topic, ...)
```

### Phase 2: Test All Skills (PDF, XLSX, DOCX, PPTX) 🔄

Create integration tests for each skill type (see test suite plan).

### Phase 3: Integrate with work_outputs 🔜

Update work_executor to handle file outputs and store metadata.

### Phase 4: Optional Supabase Storage Persistence 🔜

Download files from Claude and upload to Supabase Storage for permanent retention.

---

## 9. References

- **Cookbooks**: [claude-cookbooks/skills](https://github.com/anthropics/claude-cookbooks/tree/b29ec6f109c0379fa2eb620611a3d504e28fba09/skills)
- **Official Docs**: [Agent Skills Overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
- **Files API Docs**: [Files API](https://docs.claude.com/en/docs/build-with-claude/files)
- **YARNNN Docs**: [CLAUDE_SDK_CAPABILITIES.md](CLAUDE_SDK_CAPABILITIES.md), [WORK_OUTPUTS_ARCHITECTURE.md](WORK_OUTPUTS_ARCHITECTURE.md)

---

**Document Version**: 1.0.0
**Status**: Implementation-ready
**Next**: Apply migration + enable Skills in ReportingAgentSDK
