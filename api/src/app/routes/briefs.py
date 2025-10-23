from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict

from ..dependencies import get_current_user
from ..documents.services.context_composition import ContextCompositionService
from ..documents.services.lifecycle_management import DocumentLifecycleService
from ..utils.supabase import supabase_admin
from src.schemas.document_composition_schema import ContextDrivenCompositionRequest, ContextDrivenDocument

router = APIRouter(prefix="/briefs", tags=["briefs"])


class ComposeBriefRequest(BaseModel):
  model_config = ConfigDict(populate_by_name=True)

  basket_id: UUID = Field(..., alias="basketId")
  topic: str
  audience: str
  goals: List[str]
  citations: bool = True


class ProvenanceRef(BaseModel):
  block_id: str = Field(..., alias="blockId")
  source_url: Optional[str] = Field(None, alias="sourceUrl")
  excerpt: Optional[str] = None
  offsets: Optional[List[int]] = None


class AuditedParagraph(BaseModel):
  text: str
  provenance: List[ProvenanceRef]


class BriefSection(BaseModel):
  heading: str
  content: List[AuditedParagraph]


class AuditedBriefResponse(BaseModel):
  model_config = ConfigDict(populate_by_name=True)

  brief_id: str = Field(..., alias="id")
  title: str
  sections: List[BriefSection]
  generated_at: datetime = Field(default_factory=datetime.utcnow, alias="generatedAt")


async def _fetch_block_content(block_ids: List[str], workspace_id: str) -> Dict[str, Dict[str, Any]]:
  if not block_ids:
    return {}

  sb = supabase_admin()
  try:
    response = (
      sb.table("blocks")
      .select("id, content, metadata")
      .in_("id", block_ids)
      .eq("workspace_id", workspace_id)
      .execute()
    )
  except Exception as exc:  # noqa: BLE001
    raise HTTPException(status_code=500, detail=f"block_lookup_failed: {exc}") from exc

  results: Dict[str, Dict[str, Any]] = {}
  for row in response.data or []:
    results[row["id"]] = row
  return results


def _build_provenance(block_ids: List[Any], block_lookup: Dict[str, Dict[str, Any]], include_citations: bool) -> List[ProvenanceRef]:
  if not include_citations:
    return []

  provenance: List[ProvenanceRef] = []
  seen = set()
  for block_id in block_ids:
    block_str = str(block_id)
    if block_str in seen:
      continue
    seen.add(block_str)
    block_data = block_lookup.get(block_str, {})
    metadata = block_data.get("metadata") or {}
    provenance.append(ProvenanceRef(
      blockId=block_str,
      sourceUrl=metadata.get("source_url"),
      excerpt=(block_data.get("content") or "")[:500] or None,
      offsets=None
    ))
  return provenance


def _split_paragraphs(content: str) -> List[str]:
  return [paragraph.strip() for paragraph in content.split("\n\n") if paragraph.strip()]


def _section_dict(section: Any) -> Dict[str, Any]:
  if isinstance(section, dict):
    return section
  if hasattr(section, "model_dump"):
    return section.model_dump()
  return {
    "title": getattr(section, "title", "Untitled"),
    "content": getattr(section, "content", ""),
    "contributing_blocks": getattr(section, "contributing_blocks", []),
  }


def _compose_brief_response(document: ContextDrivenDocument, include_citations: bool) -> AuditedBriefResponse:
  discovered_lookup: Dict[str, Dict[str, Any]] = {
    str(block.block_id): {"content": block.content, "metadata": {}} for block in document.discovered_blocks
  }

  sections: List[BriefSection] = []
  for section_entry in document.document_sections:
    section_data = _section_dict(section_entry)
    paragraphs = _split_paragraphs(section_data.get("content") or "")
    provenance = _build_provenance(section_data.get("contributing_blocks", []), discovered_lookup, include_citations)
    section_paragraphs = [AuditedParagraph(text=paragraph, provenance=provenance) for paragraph in paragraphs] or [
      AuditedParagraph(text=section_data.get("content", ""), provenance=provenance)
    ]
    sections.append(BriefSection(heading=section_data.get("title") or "Untitled Section", content=section_paragraphs))

  return AuditedBriefResponse(
    id=str(document.id),
    title=document.title,
    sections=sections,
  )


def _compose_brief_from_document(document: Any, block_lookup: Dict[str, Dict[str, Any]], include_citations: bool) -> AuditedBriefResponse:
  sections: List[BriefSection] = []
  raw_sections = getattr(document, "sections", [])
  for section_entry in raw_sections:
    section_data = _section_dict(section_entry)
    paragraphs = _split_paragraphs(section_data.get("content") or "")
    provenance = _build_provenance(section_data.get("contributing_blocks", []), block_lookup, include_citations)
    section_paragraphs = [AuditedParagraph(text=paragraph, provenance=provenance) for paragraph in paragraphs] or [
      AuditedParagraph(text=section_data.get("content", ""), provenance=provenance)
    ]
    sections.append(BriefSection(heading=section_data.get("title") or "Untitled Section", content=section_paragraphs))

  return AuditedBriefResponse(
    id=str(getattr(document, "id")),
    title=getattr(document, "title"),
    sections=sections,
  )


@router.post("/compose", response_model=AuditedBriefResponse)
async def compose_brief(request: ComposeBriefRequest, current_user: dict = Depends(get_current_user)):
  try:
    contextual_request = ContextDrivenCompositionRequest(
      basket_id=request.basket_id,
      composition_intent="creative_brief",
      target_audience=request.audience,
      custom_instructions=(
        f"Compose a GTM brief focused on '{request.topic}'. "
        f"Audience: {request.audience}. Goals: {', '.join(request.goals)}. "
        "Ensure every section cites supporting substrate."
      ),
    )

    document = await ContextCompositionService.compose_contextual_document(
      request=contextual_request,
      workspace_id=current_user["workspace_id"],
      created_by=current_user["user_id"],
    )
  except Exception as exc:  # noqa: BLE001
    raise HTTPException(status_code=500, detail=f"brief_compose_failed: {exc}") from exc

  return _compose_brief_response(document, include_citations=request.citations)


@router.get("/{brief_id}/provenance", response_model=AuditedBriefResponse)
async def get_brief_provenance(brief_id: UUID, current_user: dict = Depends(get_current_user)):
  document = await DocumentLifecycleService._get_document(brief_id, current_user["workspace_id"])
  if not document:
    raise HTTPException(status_code=404, detail="brief_not_found")

  block_ids = [str(ref.block_id) for ref in getattr(document, "block_references", [])]
  block_lookup = await _fetch_block_content(block_ids, current_user["workspace_id"])
  return _compose_brief_from_document(document, block_lookup, include_citations=True)
