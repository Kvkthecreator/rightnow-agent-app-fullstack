"""
Integration tests for Claude Agent SDK Skills (file generation).

Tests all 4 Anthropic-provided skills: PDF, XLSX, DOCX, PPTX.
Validates end-to-end flow:
1. Agent generates file via Skill
2. File downloaded from Claude Files API
3. work_output record created with metadata
4. File uploaded to Supabase Storage (optional)

Prerequisites:
- ANTHROPIC_API_KEY environment variable
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for storage tests)

Run with: pytest tests/integration/test_skills_file_generation.py -v
"""

import os
import pytest
import asyncio
from uuid import uuid4
from anthropic import AsyncAnthropic

# Import Skills helper
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../src"))

from yarnnn_agents.utils.skills_helper import (
    create_skills_enabled_client,
    get_skills_for_formats,
    extract_file_ids_from_response,
    download_file_from_claude,
    create_file_work_output_metadata,
    AVAILABLE_SKILLS,
)
from yarnnn_agents.tools.work_output_tools import WorkOutput


# Test fixtures
@pytest.fixture
def anthropic_api_key():
    """Get Anthropic API key from environment"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        pytest.skip("ANTHROPIC_API_KEY not set")
    return api_key


@pytest.fixture
def claude_client(anthropic_api_key):
    """Create Skills-enabled Claude client"""
    return create_skills_enabled_client(anthropic_api_key)


@pytest.fixture
def test_basket_id():
    """Generate test basket ID"""
    return str(uuid4())


@pytest.fixture
def test_work_ticket_id():
    """Generate test work ticket ID"""
    return str(uuid4())


# ============================================================================
# Test: Skills Helper Functions
# ============================================================================

def test_skills_helper_get_skills_for_formats():
    """Test get_skills_for_formats returns correct skill configs"""
    formats = ["pdf", "xlsx"]
    skills = get_skills_for_formats(formats)

    assert len(skills) == 2
    assert skills[0] == AVAILABLE_SKILLS["pdf"]
    assert skills[1] == AVAILABLE_SKILLS["xlsx"]


def test_skills_helper_unknown_format():
    """Test get_skills_for_formats handles unknown formats"""
    formats = ["pdf", "unknown_format"]
    skills = get_skills_for_formats(formats)

    # Should only return PDF skill, ignore unknown
    assert len(skills) == 1
    assert skills[0] == AVAILABLE_SKILLS["pdf"]


# ============================================================================
# Test: PDF Skill
# ============================================================================

@pytest.mark.asyncio
async def test_pdf_skill_generation(claude_client, test_basket_id, test_work_ticket_id):
    """Test PDF report generation via Skills"""

    # Create message with PDF skill
    response = await claude_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        container={
            "skills": get_skills_for_formats(["pdf"])
        },
        tools=[
            {"type": "code_execution_20250825", "name": "code_execution"}
        ],
        messages=[
            {
                "role": "user",
                "content": """Create a PDF document titled "Skills Test Report".

Include:
- Title page with "Skills Integration Test"
- Section 1: Overview (brief description)
- Section 2: Technical Details (bullet points)
- Conclusion

Make it professional and well-formatted."""
            }
        ]
    )

    # Extract file_ids
    file_ids = extract_file_ids_from_response(response)

    # Validate file was generated
    assert len(file_ids) > 0, "No file_id found in response"

    file_id = file_ids[0]
    assert file_id.startswith("file_"), f"Invalid file_id format: {file_id}"

    # Download file
    file_content, metadata = download_file_from_claude(claude_client, file_id)

    # Validate file content
    assert len(file_content) > 0, "File content is empty"
    assert file_content[:4] == b"%PDF", "File is not a valid PDF (magic number mismatch)"

    # Validate metadata
    assert metadata["filename"].endswith(".pdf"), f"Unexpected filename: {metadata['filename']}"
    assert metadata["size_bytes"] > 1000, "PDF file too small (likely invalid)"

    # Create work_output metadata
    output_metadata = create_file_work_output_metadata(
        file_id=file_id,
        file_metadata=metadata,
        skill_id="pdf",
    )

    # Validate work_output metadata structure
    assert output_metadata["file_id"] == file_id
    assert output_metadata["file_format"] == "pdf"
    assert output_metadata["generation_method"] == "skill"
    assert "skill_metadata" in output_metadata
    assert output_metadata["skill_metadata"]["skill_id"] == "pdf"

    # Create WorkOutput instance
    work_output = WorkOutput(
        output_type="report_pdf",
        title="Skills Test Report",
        **output_metadata
    )

    # Validate WorkOutput
    assert work_output.is_file_output()
    assert work_output.file_format == "pdf"
    assert work_output.generation_method == "skill"

    print(f"✅ PDF generated successfully: {metadata['filename']} ({metadata['size_bytes']} bytes)")


# ============================================================================
# Test: XLSX Skill
# ============================================================================

@pytest.mark.asyncio
async def test_xlsx_skill_generation(claude_client):
    """Test Excel spreadsheet generation via Skills"""

    response = await claude_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        container={
            "skills": get_skills_for_formats(["xlsx"])
        },
        tools=[
            {"type": "code_execution_20250825", "name": "code_execution"}
        ],
        messages=[
            {
                "role": "user",
                "content": """Create an Excel spreadsheet titled "Sales Data".

Include:
- Sheet 1: Monthly sales data with columns: Month, Revenue, Expenses, Profit
- Add 12 rows for Jan-Dec with sample data
- Include formulas for Profit (Revenue - Expenses)
- Add a SUM formula for total revenue

Make it professional."""
            }
        ]
    )

    file_ids = extract_file_ids_from_response(response)
    assert len(file_ids) > 0, "No XLSX file generated"

    file_id = file_ids[0]
    file_content, metadata = download_file_from_claude(claude_client, file_id)

    # XLSX files are ZIP archives (OOXML format)
    assert file_content[:2] == b"PK", "File is not a valid XLSX (ZIP magic number mismatch)"
    assert metadata["filename"].endswith(".xlsx"), f"Unexpected filename: {metadata['filename']}"
    assert metadata["size_bytes"] > 2000, "XLSX file too small"

    # Create work_output
    output_metadata = create_file_work_output_metadata(
        file_id=file_id,
        file_metadata=metadata,
        skill_id="xlsx",
    )

    work_output = WorkOutput(
        output_type="spreadsheet",
        title="Sales Data Spreadsheet",
        **output_metadata
    )

    assert work_output.file_format == "xlsx"
    assert work_output.mime_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    print(f"✅ XLSX generated successfully: {metadata['filename']} ({metadata['size_bytes']} bytes)")


# ============================================================================
# Test: DOCX Skill
# ============================================================================

@pytest.mark.asyncio
async def test_docx_skill_generation(claude_client):
    """Test Word document generation via Skills"""

    response = await claude_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        container={
            "skills": get_skills_for_formats(["docx"])
        },
        tools=[
            {"type": "code_execution_20250825", "name": "code_execution"}
        ],
        messages=[
            {
                "role": "user",
                "content": """Create a Word document titled "Project Proposal".

Include:
- Title: "Skills Integration Project Proposal"
- Section 1: Executive Summary (2 paragraphs)
- Section 2: Technical Approach (bullet points)
- Section 3: Timeline (table with phases and dates)
- Conclusion

Use professional formatting with headers."""
            }
        ]
    )

    file_ids = extract_file_ids_from_response(response)
    assert len(file_ids) > 0, "No DOCX file generated"

    file_id = file_ids[0]
    file_content, metadata = download_file_from_claude(claude_client, file_id)

    # DOCX files are ZIP archives (OOXML format)
    assert file_content[:2] == b"PK", "File is not a valid DOCX (ZIP magic number mismatch)"
    assert metadata["filename"].endswith(".docx"), f"Unexpected filename: {metadata['filename']}"
    assert metadata["size_bytes"] > 2000, "DOCX file too small"

    # Create work_output
    output_metadata = create_file_work_output_metadata(
        file_id=file_id,
        file_metadata=metadata,
        skill_id="docx",
    )

    work_output = WorkOutput(
        output_type="document",
        title="Project Proposal Document",
        **output_metadata
    )

    assert work_output.file_format == "docx"
    assert work_output.mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    print(f"✅ DOCX generated successfully: {metadata['filename']} ({metadata['size_bytes']} bytes)")


# ============================================================================
# Test: PPTX Skill
# ============================================================================

@pytest.mark.asyncio
async def test_pptx_skill_generation(claude_client):
    """Test PowerPoint presentation generation via Skills"""

    response = await claude_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        container={
            "skills": get_skills_for_formats(["pptx"])
        },
        tools=[
            {"type": "code_execution_20250825", "name": "code_execution"}
        ],
        messages=[
            {
                "role": "user",
                "content": """Create a PowerPoint presentation titled "Skills Overview".

Include 5 slides:
1. Title slide: "Claude Agent SDK Skills"
2. Overview: What are Skills (bullet points)
3. File Generation: PDF, XLSX, DOCX, PPTX capabilities
4. Use Cases: 3-4 practical examples
5. Conclusion: Key takeaways

Use professional layout."""
            }
        ]
    )

    file_ids = extract_file_ids_from_response(response)
    assert len(file_ids) > 0, "No PPTX file generated"

    file_id = file_ids[0]
    file_content, metadata = download_file_from_claude(claude_client, file_id)

    # PPTX files are ZIP archives (OOXML format)
    assert file_content[:2] == b"PK", "File is not a valid PPTX (ZIP magic number mismatch)"
    assert metadata["filename"].endswith(".pptx"), f"Unexpected filename: {metadata['filename']}"
    assert metadata["size_bytes"] > 2000, "PPTX file too small"

    # Create work_output
    output_metadata = create_file_work_output_metadata(
        file_id=file_id,
        file_metadata=metadata,
        skill_id="pptx",
    )

    work_output = WorkOutput(
        output_type="presentation",
        title="Skills Overview Presentation",
        **output_metadata
    )

    assert work_output.file_format == "pptx"
    assert work_output.mime_type == "application/vnd.openxmlformats-officedocument.presentationml.presentation"

    print(f"✅ PPTX generated successfully: {metadata['filename']} ({metadata['size_bytes']} bytes)")


# ============================================================================
# Test: Multiple Skills in Single Request
# ============================================================================

@pytest.mark.asyncio
async def test_multiple_skills_single_request(claude_client):
    """Test that Claude can choose between multiple Skills"""

    response = await claude_client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        container={
            # Enable both PDF and XLSX skills
            "skills": get_skills_for_formats(["pdf", "xlsx"])
        },
        tools=[
            {"type": "code_execution_20250825", "name": "code_execution"}
        ],
        messages=[
            {
                "role": "user",
                "content": """I need a data analysis report.

Create an Excel spreadsheet with sample sales data (3 columns, 10 rows).
Include formulas and a summary.

The format should be XLSX since it's tabular data."""
            }
        ]
    )

    file_ids = extract_file_ids_from_response(response)
    assert len(file_ids) > 0, "No file generated"

    # Claude should have chosen XLSX (since we specified tabular data)
    file_id = file_ids[0]
    file_content, metadata = download_file_from_claude(claude_client, file_id)

    # Should be XLSX (ZIP magic number)
    assert file_content[:2] == b"PK", "Expected XLSX file"
    assert metadata["filename"].endswith(".xlsx"), "Claude should have chosen XLSX format"

    print(f"✅ Claude correctly chose XLSX format: {metadata['filename']}")


# ============================================================================
# Test: WorkOutput Validation
# ============================================================================

def test_work_output_file_validation():
    """Test WorkOutput validation for file outputs"""

    # Valid file output
    work_output = WorkOutput(
        output_type="report_pdf",
        title="Test Report",
        file_id="file_011CNha8iCJcU1wXNR6q4V8w",
        file_format="pdf",
        file_size_bytes=45231,
        mime_type="application/pdf",
        generation_method="skill",
        skill_metadata={"skill_id": "pdf"},
    )

    assert work_output.is_file_output()
    assert work_output.body is None

    # Invalid: both body and file_id
    with pytest.raises(ValueError, match="mutually exclusive"):
        WorkOutput(
            output_type="report_pdf",
            title="Test",
            body="some text",
            file_id="file_123",
        )

    # Invalid: neither body nor file_id
    with pytest.raises(ValueError, match="must have either body or file_id"):
        WorkOutput(
            output_type="report_pdf",
            title="Test",
        )


# ============================================================================
# Test Summary
# ============================================================================

def test_all_skills_available():
    """Verify all 4 skills are available"""
    assert "pdf" in AVAILABLE_SKILLS
    assert "xlsx" in AVAILABLE_SKILLS
    assert "docx" in AVAILABLE_SKILLS
    assert "pptx" in AVAILABLE_SKILLS

    # Verify structure
    for skill_id, config in AVAILABLE_SKILLS.items():
        assert config["type"] == "anthropic"
        assert config["skill_id"] == skill_id
        assert config["version"] == "latest"


if __name__ == "__main__":
    # Run tests manually
    print("Running Skills integration tests...")
    print("=" * 70)

    # Check environment
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY not set. Skipping tests.")
        exit(1)

    # Run with pytest
    import subprocess
    result = subprocess.run(
        ["pytest", __file__, "-v", "--tb=short"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

    exit(result.returncode)
