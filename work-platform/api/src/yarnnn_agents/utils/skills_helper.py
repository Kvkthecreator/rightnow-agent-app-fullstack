"""
Skills Helper - Utilities for working with Claude Agent SDK Skills.

This module provides helper functions for:
- Enabling Skills in Anthropic client
- Extracting file_ids from Claude responses
- Downloading files from Claude Files API
- Uploading files to Supabase Storage
- Creating work_outputs with file metadata

Based on: https://github.com/anthropics/claude-cookbooks/tree/b29ec6f109c0379fa2eb620611a3d504e28fba09/skills
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from anthropic import Anthropic
from anthropic.types import Message

logger = logging.getLogger(__name__)


# Skills beta headers (required for Skills API)
SKILLS_BETA_HEADERS = {
    "anthropic-beta": "code-execution-2025-08-25,files-api-2025-04-14,skills-2025-10-02"
}

# Built-in Anthropic Skills
AVAILABLE_SKILLS = {
    "pdf": {"type": "anthropic", "skill_id": "pdf", "version": "latest"},
    "xlsx": {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
    "docx": {"type": "anthropic", "skill_id": "docx", "version": "latest"},
    "pptx": {"type": "anthropic", "skill_id": "pptx", "version": "latest"},
}

# MIME types mapping
MIME_TYPES = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "png": "image/png",
    "jpg": "image/jpeg",
    "csv": "text/csv",
}


def create_skills_enabled_client(api_key: str) -> Anthropic:
    """
    Create Anthropic client with Skills support enabled.

    Args:
        api_key: Anthropic API key

    Returns:
        Anthropic client with Skills beta headers
    """
    return Anthropic(
        api_key=api_key,
        default_headers=SKILLS_BETA_HEADERS
    )


def get_skills_for_formats(formats: List[str]) -> List[Dict[str, str]]:
    """
    Get skill configurations for specified file formats.

    Args:
        formats: List of format strings (e.g., ["pdf", "xlsx"])

    Returns:
        List of skill configuration dicts for container parameter

    Example:
        skills = get_skills_for_formats(["pdf", "xlsx"])
        response = client.messages.create(
            container={"skills": skills},
            ...
        )
    """
    skills = []
    for fmt in formats:
        if fmt in AVAILABLE_SKILLS:
            skills.append(AVAILABLE_SKILLS[fmt])
        else:
            logger.warning(f"Unknown skill format: {fmt}")
    return skills


def extract_file_ids_from_response(response: Message) -> List[str]:
    """
    Extract all file_ids from Claude response.

    Skills return file_ids embedded in tool_result blocks.
    This function finds all file_id references in the response.

    Args:
        response: Claude API response (anthropic.types.Message)

    Returns:
        List of file_id strings (e.g., ["file_011CNha...", "file_022XYZ..."])

    Example:
        response = client.messages.create(...)
        file_ids = extract_file_ids_from_response(response)
        for file_id in file_ids:
            download_file(client, file_id)
    """
    file_ids = []

    for block in response.content:
        if block.type == "tool_result":
            # file_id may be in different formats
            content_str = str(block.content) if hasattr(block, 'content') else str(block)

            # Pattern: file_01AbCdEfGhIjKl... (22 alphanumeric chars after underscore)
            matches = re.findall(r'file_[A-Za-z0-9]{22}', content_str)
            file_ids.extend(matches)

    # Deduplicate
    return list(set(file_ids))


def download_file_from_claude(
    client: Anthropic,
    file_id: str
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Download file from Claude Files API.

    Args:
        client: Anthropic client (with Skills beta headers)
        file_id: File identifier from Claude response

    Returns:
        Tuple of (file_content_bytes, metadata_dict)

    Raises:
        Exception: If download fails

    Example:
        file_content, metadata = download_file_from_claude(client, "file_011CNha...")
        with open(f"{metadata['filename']}", "wb") as f:
            f.write(file_content)
    """
    try:
        # Get metadata first
        metadata_obj = client.beta.files.retrieve_metadata(file_id=file_id)
        metadata = {
            "id": metadata_obj.id,
            "filename": metadata_obj.filename,
            "size_bytes": metadata_obj.size_bytes,  # Use size_bytes, not size!
            "created_at": metadata_obj.created_at,
        }

        # Download file content
        file_stream = client.beta.files.download(file_id=file_id)
        file_content = file_stream.read()  # Use .read(), not .content!

        logger.info(f"Downloaded file {file_id}: {metadata['filename']} ({metadata['size_bytes']} bytes)")
        return file_content, metadata

    except Exception as e:
        logger.error(f"Failed to download file {file_id}: {e}")
        raise


def infer_file_format_from_filename(filename: str) -> Optional[str]:
    """
    Infer file format from filename extension.

    Args:
        filename: Filename with extension (e.g., "report.pdf")

    Returns:
        File format string (e.g., "pdf") or None if unknown
    """
    if not filename:
        return None

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else None
    return ext if ext in MIME_TYPES else None


def get_mime_type(file_format: str) -> str:
    """
    Get MIME type for file format.

    Args:
        file_format: File format (e.g., "pdf", "xlsx")

    Returns:
        MIME type string (e.g., "application/pdf")
    """
    return MIME_TYPES.get(file_format, "application/octet-stream")


def create_file_work_output_metadata(
    file_id: str,
    file_metadata: Dict[str, Any],
    skill_id: Optional[str] = None,
    container_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create metadata dict for file-based work_output.

    This prepares the data structure for storing file outputs
    in the work_outputs table.

    Args:
        file_id: Claude Files API identifier
        file_metadata: Metadata from download_file_from_claude
        skill_id: Skill that generated the file (e.g., "pdf", "xlsx")
        container_id: Claude container ID from response

    Returns:
        Dict ready for WorkOutput instantiation

    Example:
        file_content, metadata = download_file_from_claude(client, file_id)
        output_data = create_file_work_output_metadata(
            file_id=file_id,
            file_metadata=metadata,
            skill_id="pdf"
        )
        work_output = WorkOutput(
            output_type="report_pdf",
            title="Q4 Report",
            **output_data
        )
    """
    file_format = infer_file_format_from_filename(file_metadata["filename"])

    result = {
        "file_id": file_id,
        "file_format": file_format,
        "file_size_bytes": file_metadata["size_bytes"],
        "mime_type": get_mime_type(file_format) if file_format else None,
        "generation_method": "skill" if skill_id else "code_execution",
    }

    # Add skill metadata if skill was used
    if skill_id:
        result["skill_metadata"] = {
            "skill_id": skill_id,
            "skill_name": f"{skill_id.upper()} Generator",
            "skill_version": "latest",
            "container_id": container_id,
            "filename": file_metadata["filename"],
        }

    return result


def upload_file_to_supabase_storage(
    supabase_client: Any,  # supabase.Client
    bucket_name: str,
    storage_path: str,
    file_content: bytes,
    mime_type: str,
) -> str:
    """
    Upload file to Supabase Storage.

    Args:
        supabase_client: Supabase client instance
        bucket_name: Storage bucket name (e.g., "yarnnn-assets")
        storage_path: Full storage path (e.g., "baskets/{basket_id}/work_outputs/{ticket_id}/report.pdf")
        file_content: File binary content
        mime_type: MIME type for Content-Type header

    Returns:
        Public URL of uploaded file

    Raises:
        Exception: If upload fails

    Example:
        public_url = upload_file_to_supabase_storage(
            supabase_client=supabase,
            bucket_name="yarnnn-assets",
            storage_path="baskets/abc-123/work_outputs/xyz-789/report.pdf",
            file_content=file_bytes,
            mime_type="application/pdf"
        )
    """
    try:
        # Upload to storage
        supabase_client.storage.from_(bucket_name).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": mime_type, "upsert": "true"}
        )

        # Get public URL
        public_url = supabase_client.storage.from_(bucket_name).get_public_url(storage_path)

        logger.info(f"Uploaded file to Supabase Storage: {storage_path}")
        return public_url

    except Exception as e:
        logger.error(f"Failed to upload file to Supabase Storage: {e}")
        raise


def process_skills_response_to_work_outputs(
    response: Message,
    client: Anthropic,
    basket_id: str,
    work_ticket_id: str,
    supabase_client: Optional[Any] = None,
) -> List[Dict[str, Any]]:
    """
    Process Claude Skills response and prepare work_output data.

    This is a convenience function that:
    1. Extracts file_ids from response
    2. Downloads files from Claude
    3. Optionally uploads to Supabase Storage
    4. Returns work_output metadata dicts

    Args:
        response: Claude API response
        client: Anthropic client
        basket_id: Basket ID for storage path
        work_ticket_id: Work ticket ID for storage path
        supabase_client: Optional Supabase client for persistence

    Returns:
        List of dicts ready for WorkOutput instantiation

    Example:
        response = client.messages.create(...)
        outputs_data = process_skills_response_to_work_outputs(
            response=response,
            client=client,
            basket_id="abc-123",
            work_ticket_id="xyz-789",
            supabase_client=supabase
        )
        for data in outputs_data:
            work_output = WorkOutput(
                output_type="report_pdf",
                title="Generated Report",
                **data
            )
            db.create_work_output(work_output)
    """
    file_ids = extract_file_ids_from_response(response)
    outputs_data = []

    for file_id in file_ids:
        try:
            # Download from Claude
            file_content, file_metadata = download_file_from_claude(client, file_id)

            # Create base metadata
            output_data = create_file_work_output_metadata(
                file_id=file_id,
                file_metadata=file_metadata,
                skill_id=None,  # Could be inferred from response
                container_id=response.id if hasattr(response, 'id') else None,
            )

            # Upload to Supabase Storage if client provided
            if supabase_client:
                filename = file_metadata["filename"]
                storage_path = f"baskets/{basket_id}/work_outputs/{work_ticket_id}/{filename}"

                try:
                    upload_file_to_supabase_storage(
                        supabase_client=supabase_client,
                        bucket_name="yarnnn-assets",
                        storage_path=storage_path,
                        file_content=file_content,
                        mime_type=output_data["mime_type"],
                    )
                    output_data["storage_path"] = storage_path
                except Exception as e:
                    logger.warning(f"Failed to upload to Supabase Storage: {e}. Continuing with file_id only.")

            outputs_data.append(output_data)

        except Exception as e:
            logger.error(f"Failed to process file {file_id}: {e}")
            continue

    return outputs_data
