"""
P4 Canon Generation Endpoints

Implements P4 document taxonomy:
- document_canon: Basket Context Canon (mandatory, ONE per basket)
- starter_prompt: Reasoning capsules for external hosts (MANY per basket)

Note: Separate from existing p4_composition.py which handles general document composition.
      This module focuses specifically on canon generation workflows.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

from app.utils.supabase import supabase_admin
from lib.freshness import (
    should_regenerate_document_canon,
    compute_basket_substrate_hash
)
from middleware.auth import get_current_user

router = APIRouter(prefix="/p4", tags=["p4-documents"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class GenerateDocumentCanonRequest(BaseModel):
    basket_id: str = Field(..., description="Target basket UUID")
    force: bool = Field(False, description="Force regeneration even if fresh")
    composition_mode: Optional[str] = Field(
        "comprehensive",
        description="Composition style: comprehensive, concise, narrative"
    )


class GenerateDocumentCanonResponse(BaseModel):
    document_id: str
    basket_id: str
    title: str
    version_hash: str
    is_fresh: bool
    previous_id: Optional[str]
    derived_from: Dict[str, Any]
    created_at: datetime


class GenerateStarterPromptRequest(BaseModel):
    basket_id: str
    target_host: str = Field(..., description="Target host: claude_ai, chatgpt, cursor, etc.")
    scope_filter: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional substrate filter for focused prompts"
    )
    prompt_style: Optional[str] = Field(
        "concise",
        description="Style: concise, detailed, creative"
    )


class GenerateStarterPromptResponse(BaseModel):
    document_id: str
    basket_id: str
    title: str
    target_host: str
    version_hash: str
    content_preview: str
    created_at: datetime


# =============================================================================
# DOCUMENT CANON ENDPOINTS
# =============================================================================

@router.post("/document-canon", response_model=GenerateDocumentCanonResponse)
async def generate_document_canon(
    request: GenerateDocumentCanonRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate or regenerate document_canon (Basket Context Canon).

    Direct operation (not governed per Canon v3.1).
    Document Canon is the mandatory comprehensive view of basket state.

    Process:
    1. Check if basket has document_canon
    2. If exists and fresh (unless force), return existing
    3. Otherwise, compose new canon from P3 insight_canon + substrate
    4. Create new document_version
    5. Link via previous_id for version chain
    """
    supabase = supabase_admin()

    # Check staleness
    staleness_check = should_regenerate_document_canon(supabase, request.basket_id)

    if not staleness_check['stale'] and not request.force:
        # Return existing fresh canon
        current = staleness_check['current_canon']
        return GenerateDocumentCanonResponse(
            document_id=current['id'],
            basket_id=current['basket_id'],
            title=current['title'],
            version_hash=current['current_version_hash'],
            is_fresh=True,
            previous_id=current.get('previous_id'),
            derived_from=current.get('derived_from', {}),
            created_at=current['created_at']
        )

    # Get basket details
    basket_result = supabase.table('baskets').select('workspace_id, name').eq('id', request.basket_id).single().execute()
    if not basket_result.data:
        raise HTTPException(status_code=404, detail="Basket not found")

    basket = basket_result.data
    workspace_id = basket['workspace_id']
    basket_name = basket.get('name', 'Untitled Basket')

    # Get current insight_canon
    insight_canon_result = supabase.table('reflections_artifact').select('*').eq(
        'basket_id', request.basket_id
    ).eq('insight_type', 'insight_canon').eq('is_current', True).limit(1).execute()

    if not insight_canon_result.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate document_canon without insight_canon. Generate insight_canon first."
        )

    insight_canon = insight_canon_result.data[0]

    # Fetch substrate
    substrate = await _fetch_basket_substrate_for_canon(supabase, request.basket_id)

    # Compose document canon content
    canon_content = await _compose_document_canon(
        basket_name=basket_name,
        insight_canon=insight_canon,
        substrate=substrate,
        composition_mode=request.composition_mode
    )

    # Compute version hash
    import hashlib
    version_hash = hashlib.sha256(canon_content.encode()).hexdigest()[:64]

    # Compute substrate hash
    substrate_hash = compute_basket_substrate_hash(supabase, request.basket_id)

    # Build provenance
    derived_from = {
        'insight_canon_id': insight_canon['id'],
        'substrate_hash': substrate_hash,
        'composition_mode': request.composition_mode,
        'generated_at': datetime.utcnow().isoformat()
    }

    # Check if document_canon already exists
    existing_doc = supabase.table('documents').select('id, current_version_hash').eq(
        'basket_id', request.basket_id
    ).eq('doc_type', 'document_canon').limit(1).execute()

    previous_id = None
    document_id = None

    if existing_doc.data:
        # Update existing document with new version
        previous_id = existing_doc.data[0]['id']

        # Create new document record (versioned document evolution)
        new_doc = supabase.table('documents').insert({
            'basket_id': request.basket_id,
            'workspace_id': workspace_id,
            'title': f"{basket_name} - Context Canon",
            'document_type': 'basket_context',  # Legacy field
            'doc_type': 'document_canon',
            'current_version_hash': version_hash,
            'previous_id': previous_id,
            'derived_from': derived_from,
            'composition_instructions': {
                'mode': request.composition_mode,
                'source': 'p4_canon_generator'
            }
        }).execute()

        if not new_doc.data:
            raise HTTPException(status_code=500, detail="Failed to create document")

        document_id = new_doc.data[0]['id']

    else:
        # Create new document_canon
        new_doc = supabase.table('documents').insert({
            'basket_id': request.basket_id,
            'workspace_id': workspace_id,
            'title': f"{basket_name} - Context Canon",
            'document_type': 'basket_context',
            'doc_type': 'document_canon',
            'current_version_hash': version_hash,
            'derived_from': derived_from,
            'composition_instructions': {
                'mode': request.composition_mode,
                'source': 'p4_canon_generator'
            }
        }).execute()

        if not new_doc.data:
            raise HTTPException(status_code=500, detail="Failed to create document")

        document_id = new_doc.data[0]['id']

    # Create document_version record
    version = supabase.table('document_versions').insert({
        'document_id': document_id,
        'version_hash': version_hash,
        'content': canon_content,
        'metadata_snapshot': {
            'insight_canon_id': insight_canon['id'],
            'substrate_hash': substrate_hash,
            'composition_mode': request.composition_mode
        },
        'substrate_refs_snapshot': _build_substrate_refs(substrate),
        'version_trigger': 'p4_canon_regeneration',
        'version_message': 'Generated from current insight_canon and substrate'
    }).execute()

    if not version.data:
        raise HTTPException(status_code=500, detail="Failed to create document version")

    return GenerateDocumentCanonResponse(
        document_id=document_id,
        basket_id=request.basket_id,
        title=f"{basket_name} - Context Canon",
        version_hash=version_hash,
        is_fresh=True,
        previous_id=previous_id,
        derived_from=derived_from,
        created_at=new_doc.data[0]['created_at']
    )


# =============================================================================
# STARTER PROMPT ENDPOINTS
# =============================================================================

@router.post("/starter-prompt", response_model=GenerateStarterPromptResponse)
async def generate_starter_prompt(
    request: GenerateStarterPromptRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate starter_prompt for external AI host.

    Starter prompts are reasoning capsules optimized for specific hosts:
    - claude_ai: Claude.ai chat interface
    - chatgpt: ChatGPT web/app
    - cursor: Cursor IDE
    - windsurf: Windsurf editor
    - etc.

    Each prompt captures basket context in a concise, actionable format.
    """
    supabase = supabase_admin()

    # Get basket details
    basket_result = supabase.table('baskets').select('workspace_id, name').eq('id', request.basket_id).single().execute()
    if not basket_result.data:
        raise HTTPException(status_code=404, detail="Basket not found")

    basket = basket_result.data
    workspace_id = basket['workspace_id']
    basket_name = basket.get('name', 'Untitled Basket')

    # Get insight_canon
    insight_canon_result = supabase.table('reflections_artifact').select('*').eq(
        'basket_id', request.basket_id
    ).eq('insight_type', 'insight_canon').eq('is_current', True).limit(1).execute()

    if not insight_canon_result.data:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate starter_prompt without insight_canon."
        )

    insight_canon = insight_canon_result.data[0]

    # Fetch substrate (filtered if scope_filter provided)
    substrate = await _fetch_basket_substrate_filtered(
        supabase,
        request.basket_id,
        request.scope_filter
    )

    # Compose starter prompt
    prompt_content = await _compose_starter_prompt(
        basket_name=basket_name,
        target_host=request.target_host,
        insight_canon=insight_canon,
        substrate=substrate,
        prompt_style=request.prompt_style
    )

    # Compute version hash
    import hashlib
    version_hash = hashlib.sha256(prompt_content.encode()).hexdigest()[:64]

    # Create starter_prompt document
    new_doc = supabase.table('documents').insert({
        'basket_id': request.basket_id,
        'workspace_id': workspace_id,
        'title': f"{basket_name} - {request.target_host.title()} Starter",
        'document_type': 'starter_prompt',
        'doc_type': 'starter_prompt',
        'current_version_hash': version_hash,
        'derived_from': {
            'insight_canon_id': insight_canon['id'],
            'target_host': request.target_host,
            'prompt_style': request.prompt_style
        },
        'composition_instructions': {
            'target_host': request.target_host,
            'style': request.prompt_style,
            'scope_filter': request.scope_filter
        }
    }).execute()

    if not new_doc.data:
        raise HTTPException(status_code=500, detail="Failed to create starter prompt")

    document_id = new_doc.data[0]['id']

    # Create document_version
    version = supabase.table('document_versions').insert({
        'document_id': document_id,
        'version_hash': version_hash,
        'content': prompt_content,
        'metadata_snapshot': {
            'insight_canon_id': insight_canon['id'],
            'target_host': request.target_host,
            'style': request.prompt_style
        },
        'substrate_refs_snapshot': _build_substrate_refs(substrate),
        'version_trigger': 'starter_prompt_generation',
        'version_message': f'Generated for {request.target_host}'
    }).execute()

    if not version.data:
        raise HTTPException(status_code=500, detail="Failed to create prompt version")

    # Preview (first 200 chars)
    content_preview = prompt_content[:200] + "..." if len(prompt_content) > 200 else prompt_content

    return GenerateStarterPromptResponse(
        document_id=document_id,
        basket_id=request.basket_id,
        title=f"{basket_name} - {request.target_host.title()} Starter",
        target_host=request.target_host,
        version_hash=version_hash,
        content_preview=content_preview,
        created_at=new_doc.data[0]['created_at']
    )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def _fetch_basket_substrate_for_canon(supabase, basket_id: str) -> Dict[str, Any]:
    """Fetch all substrate for canon composition."""
    blocks = supabase.table('blocks').select('*').eq('basket_id', basket_id).eq('state', 'ACTIVE').execute()
    context_items = supabase.table('context_items').select('*').eq('basket_id', basket_id).eq('state', 'ACTIVE').execute()
    dumps = supabase.table('raw_dumps').select('*').eq('basket_id', basket_id).execute()
    events = supabase.table('timeline_events').select('*').eq('basket_id', basket_id).order('timestamp').execute()

    return {
        'blocks': blocks.data,
        'context_items': context_items.data,
        'dumps': dumps.data,
        'events': events.data
    }


async def _fetch_basket_substrate_filtered(
    supabase,
    basket_id: str,
    scope_filter: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Fetch substrate with optional filtering."""
    # TODO: Implement filtering logic based on scope_filter
    # For now, return all substrate
    return await _fetch_basket_substrate_for_canon(supabase, basket_id)


async def _compose_document_canon(
    basket_name: str,
    insight_canon: Dict[str, Any],
    substrate: Dict[str, Any],
    composition_mode: Optional[str]
) -> str:
    """
    Compose document canon content from insight + substrate using LLM.
    """
    from services.llm import get_llm

    # Format substrate
    blocks = substrate.get('blocks', [])
    context_items = substrate.get('context_items', [])
    dumps = substrate.get('dumps', [])
    events = substrate.get('events', [])

    # Build prompt for document canon
    prompt = f"""You are composing a Basket Context Canon - a comprehensive document that captures the complete state and understanding of a knowledge basket.

**Basket**: {basket_name}

**Current Insight Canon** (Core Understanding):
{insight_canon.get('reflection_text', 'No insight available')}

**Substrate Available**:
- {len(blocks)} blocks (structured knowledge)
- {len(context_items)} context items (markers and labels)
- {len(dumps)} raw dumps (original captures)
- {len(events)} timeline events (temporal markers)

**Composition Mode**: {composition_mode or 'comprehensive'}

**Your Task**: Create a {composition_mode or 'comprehensive'} Basket Context Canon document that:

1. **Synthesizes the Insight Canon** - Use it as the foundation
2. **Weaves in Key Substrate** - Include relevant examples from blocks, context items
3. **Provides Structure** - Organize into clear sections
4. **Captures Context** - Help someone understand this basket deeply

{"**Style**: Comprehensive and detailed. Include all major themes, blocks, and connections." if composition_mode == 'comprehensive' else ""}
{"**Style**: Concise and focused. Highlight only the most essential points." if composition_mode == 'concise' else ""}
{"**Style**: Narrative and engaging. Tell the story of this knowledge." if composition_mode == 'narrative' else ""}

Write the Document Canon in markdown format (500-1500 words depending on mode)."""

    llm = get_llm()
    response = await llm.get_text_response(prompt, temperature=0.6, max_tokens=2500)

    if not response.success:
        # Fallback to structured format
        return f"""# {basket_name} - Context Canon

## Insight Canon

{insight_canon.get('reflection_text', 'No insight available')}

## Substrate Summary

- {len(blocks)} blocks
- {len(context_items)} context items
- {len(dumps)} dumps
- {len(events)} events

*LLM composition failed: {response.error}*
"""

    return response.content


async def _compose_starter_prompt(
    basket_name: str,
    target_host: str,
    insight_canon: Dict[str, Any],
    substrate: Dict[str, Any],
    prompt_style: Optional[str]
) -> str:
    """
    Compose starter prompt for target host using LLM.
    """
    from services.llm import get_llm

    # Host-specific instructions
    host_instructions = {
        'claude_ai': 'Optimize for Claude.ai chat - provide context that helps Claude understand the basket deeply and respond helpfully.',
        'chatgpt': 'Optimize for ChatGPT - provide clear, structured context that GPT can use to assist effectively.',
        'cursor': 'Optimize for Cursor IDE - provide technical context that helps with coding tasks.',
        'windsurf': 'Optimize for Windsurf editor - provide project context for intelligent code assistance.'
    }.get(target_host, 'Provide clear context for AI assistance.')

    prompt = f"""Create a Starter Prompt for {target_host} that encapsulates this knowledge basket's context.

**Basket**: {basket_name}

**Core Understanding** (Insight Canon):
{insight_canon.get('reflection_text', 'No insight available')}

**Available Knowledge**:
- {len(substrate.get('blocks', []))} blocks
- {len(substrate.get('context_items', []))} context items
- {len(substrate.get('dumps', []))} dumps

**Target Host**: {target_host}
{host_instructions}

**Style**: {prompt_style or 'concise'}

**Your Task**: Write a starter prompt (200-400 words) that:
1. Captures the essence of this basket's knowledge
2. Provides necessary context for the AI host
3. Enables productive interaction
4. Is formatted appropriately for {target_host}

{"Keep it brief and focused." if prompt_style == 'concise' else ""}
{"Provide thorough detail and background." if prompt_style == 'detailed' else ""}
{"Use creative, engaging language." if prompt_style == 'creative' else ""}

Write the starter prompt now:"""

    llm = get_llm()
    response = await llm.get_text_response(prompt, temperature=0.7, max_tokens=800)

    if not response.success:
        # Fallback
        return f"""Working on: {basket_name}

Context: {insight_canon.get('reflection_text', 'No insight available')[:300]}

Available: {len(substrate.get('blocks', []))} blocks, {len(substrate.get('context_items', []))} context items

*LLM generation failed: {response.error}*"""

    return response.content


def _build_substrate_refs(substrate: Dict[str, Any]) -> Dict[str, List[str]]:
    """Build substrate references snapshot."""
    return {
        'block_ids': [b['id'] for b in substrate.get('blocks', [])],
        'context_item_ids': [c['id'] for c in substrate.get('context_items', [])],
        'dump_ids': [d['id'] for d in substrate.get('dumps', [])],
        'event_ids': [e['id'] for e in substrate.get('events', [])]
    }
