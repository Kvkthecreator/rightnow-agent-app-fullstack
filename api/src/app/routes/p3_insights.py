"""
P3 Insights Generation Endpoints (V3.0 Compliant)

Implements P3 taxonomy:
- insight_canon: Basket-level "what matters now" (ONE current per basket)
- doc_insight: Document-scoped interpretations (ONE per document)
- timeboxed_insight: Temporal window understanding (MANY per basket)

Note: review_insight is computed ephemeral (stored in proposals.review_insight)
Note: workspace insights require policy enablement (p3_p4_regeneration_policy.workspace_insight_enabled)

V3.0 Migration Completed:
- Removed context_items references (merged into blocks table)
- Updated state queries to use V3.0 enum values (ACCEPTED, LOCKED, CONSTANT)
- All substrate queries now canon-compliant
"""


from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

from app.utils.supabase import supabase_admin
from lib.freshness import (
    should_regenerate_insight_canon,
    compute_basket_substrate_hash,
    compute_graph_signature
)
from app.utils.jwt import verify_jwt

router = APIRouter(prefix="/p3", tags=["p3-insights"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class GenerateInsightCanonRequest(BaseModel):
    basket_id: str = Field(..., description="Target basket UUID")
    force: bool = Field(False, description="Force regeneration even if fresh")
    agent_context: Optional[Dict[str, Any]] = Field(None, description="Optional context for AI agent")


class GenerateInsightCanonResponse(BaseModel):
    insight_id: str
    basket_id: str
    is_fresh: bool
    previous_id: Optional[str]
    substrate_hash: str
    graph_signature: str
    reflection_text: str
    derived_from: List[Dict[str, Any]]
    created_at: datetime


class GenerateDocInsightRequest(BaseModel):
    document_id: str = Field(..., description="Target document UUID")
    force: bool = Field(False, description="Force regeneration even if fresh")


class GenerateDocInsightResponse(BaseModel):
    insight_id: str
    document_id: str
    basket_id: str
    reflection_text: str
    substrate_hash: str
    derived_from: List[Dict[str, Any]]
    created_at: datetime


class GenerateTimeboxedInsightRequest(BaseModel):
    basket_id: str
    window_start: datetime
    window_end: datetime
    focus_query: Optional[str] = Field(None, description="Optional focus for temporal analysis")


class GenerateTimeboxedInsightResponse(BaseModel):
    insight_id: str
    basket_id: str
    window_start: datetime
    window_end: datetime
    reflection_text: str
    substrate_hash: str
    created_at: datetime


# =============================================================================
# INSIGHT CANON ENDPOINTS
# =============================================================================

@router.post("/insight-canon", response_model=GenerateInsightCanonResponse)
async def generate_insight_canon(
    request: GenerateInsightCanonRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(verify_jwt)
):
    """
    Generate or regenerate insight_canon for a basket.

    Direct operation (not governed per Canon v3.1).
    Checks staleness unless force=True.

    Process:
    1. Check if basket has current insight_canon
    2. If exists and fresh (unless force), return existing
    3. Otherwise, generate new insight from substrate
    4. Mark old as is_current=false, new as is_current=true
    5. Link via previous_id for version chain
    """
    supabase = supabase_admin()

    # Check staleness
    staleness_check = should_regenerate_insight_canon(supabase, request.basket_id)

    if not staleness_check['stale'] and not request.force:
        # Return existing fresh insight
        current = staleness_check['current_canon']
        return GenerateInsightCanonResponse(
            insight_id=current['id'],
            basket_id=current['basket_id'],
            is_fresh=True,
            previous_id=current.get('previous_id'),
            substrate_hash=current['substrate_hash'],
            graph_signature=current.get('graph_signature', ''),
            reflection_text=current['reflection_text'],
            derived_from=current.get('derived_from', []),
            created_at=current['created_at']
        )

    # Get basket workspace
    basket_result = supabase.table('baskets').select('workspace_id').eq('id', request.basket_id).single().execute()
    if not basket_result.data:
        raise HTTPException(status_code=404, detail="Basket not found")

    workspace_id = basket_result.data['workspace_id']

    # Fetch substrate for AI generation
    substrate = await _fetch_basket_substrate(supabase, request.basket_id)

    # Generate insight via AI (placeholder - integrate with your LLM service)
    reflection_text = await _generate_insight_text(
        substrate=substrate,
        insight_type='insight_canon',
        agent_context=request.agent_context
    )

    # Compute current hashes
    substrate_hash = compute_basket_substrate_hash(supabase, request.basket_id)
    graph_signature = compute_graph_signature(supabase, request.basket_id)

    # Build derived_from provenance
    derived_from = _build_substrate_provenance(substrate)

    # Check if insight with this substrate_hash already exists (cache hit)
    # Skip cache if force=True (user explicitly requested regeneration)
    existing_insight = None
    if not request.force:
        existing_insight = supabase.table('reflections_artifact').select('*').eq(
            'basket_id', request.basket_id
        ).eq('insight_type', 'insight_canon').eq(
            'substrate_hash', substrate_hash
        ).maybe_single().execute()

    if existing_insight and existing_insight.data:
        # Reuse cached insight - just mark it as current
        insight = existing_insight.data

        # Mark old insight as not current (if different from cached)
        if staleness_check['current_canon'] and staleness_check['current_canon']['id'] != insight['id']:
            supabase.table('reflections_artifact').update({
                'is_current': False
            }).eq('id', staleness_check['current_canon']['id']).execute()

        # Mark cached insight as current
        supabase.table('reflections_artifact').update({
            'is_current': True
        }).eq('id', insight['id']).execute()

        insight['is_current'] = True  # Update local copy
    else:
        # Generate new insight - substrate has changed
        # Mark old insight as not current
        previous_id = None
        if staleness_check['current_canon']:
            previous_id = staleness_check['current_canon']['id']
            supabase.table('reflections_artifact').update({
                'is_current': False
            }).eq('id', previous_id).execute()

        # Insert new insight
        new_insight = supabase.table('reflections_artifact').insert({
            'basket_id': request.basket_id,
            'workspace_id': workspace_id,
            'reflection_text': reflection_text,
            'substrate_hash': substrate_hash,
            'graph_signature': graph_signature,
            'insight_type': 'insight_canon',
            'is_current': True,
            'previous_id': previous_id,
            'derived_from': derived_from,
            'computation_timestamp': datetime.utcnow().isoformat()
        }).execute()

        if not new_insight.data:
            raise HTTPException(status_code=500, detail="Failed to create insight")

        insight = new_insight.data[0]

    return GenerateInsightCanonResponse(
        insight_id=insight['id'],
        basket_id=insight['basket_id'],
        is_fresh=True,
        previous_id=insight.get('previous_id'),
        substrate_hash=insight.get('substrate_hash', substrate_hash),
        graph_signature=insight.get('graph_signature', graph_signature),
        reflection_text=insight.get('reflection_text', reflection_text),
        derived_from=insight.get('derived_from', derived_from),
        created_at=insight['created_at']
    )


# =============================================================================
# DOC INSIGHT ENDPOINTS
# =============================================================================

@router.post("/doc-insight", response_model=GenerateDocInsightResponse)
async def generate_doc_insight(
    request: GenerateDocInsightRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Generate doc_insight for a specific document.

    Scoped to document context - interprets document's meaning/purpose.
    """
    supabase = supabase_admin()

    # Get document and its current version
    doc_result = supabase.table('documents').select(
        'id, basket_id, workspace_id, title, current_version_hash'
    ).eq('id', request.document_id).single().execute()

    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = doc_result.data

    # Check if doc_insight already exists (unless force)
    if not request.force:
        existing = supabase.table('reflections_artifact').select('*').eq(
            'basket_id', document['basket_id']
        ).eq('insight_type', 'doc_insight').eq(
            'reflection_target_id', document['id']  # Legacy field but may still exist in old data
        ).execute()

        # TODO: Once fully migrated, search by derived_from instead

    # Fetch document content
    version_result = supabase.table('document_versions').select('content, metadata_snapshot').eq(
        'document_id', request.document_id
    ).eq('version_hash', document['current_version_hash']).single().execute()

    if not version_result.data:
        raise HTTPException(status_code=404, detail="Document version not found")

    doc_content = version_result.data['content']

    # Generate doc-specific insight
    reflection_text = await _generate_insight_text(
        substrate={'document_title': document['title'], 'document_content': doc_content},
        insight_type='doc_insight'
    )

    # Compute substrate hash (document-scoped)
    substrate_hash = f"doc_{document['current_version_hash']}"

    # Insert doc_insight
    new_insight = supabase.table('reflections_artifact').insert({
        'basket_id': document['basket_id'],
        'workspace_id': document['workspace_id'],
        'reflection_text': reflection_text,
        'substrate_hash': substrate_hash,
        'insight_type': 'doc_insight',
        'is_current': False,  # doc_insights don't use is_current (many per document over time)
        'derived_from': [{'type': 'document', 'id': document['id'], 'version': document['current_version_hash']}],
        'computation_timestamp': datetime.utcnow().isoformat()
    }).execute()

    if not new_insight.data:
        raise HTTPException(status_code=500, detail="Failed to create doc insight")

    insight = new_insight.data[0]

    return GenerateDocInsightResponse(
        insight_id=insight['id'],
        document_id=document['id'],
        basket_id=document['basket_id'],
        reflection_text=reflection_text,
        substrate_hash=substrate_hash,
        derived_from=insight['derived_from'],
        created_at=insight['created_at']
    )


# =============================================================================
# TIMEBOXED INSIGHT ENDPOINTS
# =============================================================================

@router.post("/timeboxed-insight", response_model=GenerateTimeboxedInsightResponse)
async def generate_timeboxed_insight(
    request: GenerateTimeboxedInsightRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Generate timeboxed_insight for a temporal window.

    Useful for "what happened this week" or "sprint retrospective" style insights.
    """
    supabase = supabase_admin()

    # Get basket workspace
    basket_result = supabase.table('baskets').select('workspace_id').eq('id', request.basket_id).single().execute()
    if not basket_result.data:
        raise HTTPException(status_code=404, detail="Basket not found")

    workspace_id = basket_result.data['workspace_id']

    # Fetch substrate within time window
    substrate = await _fetch_basket_substrate_timeboxed(
        supabase,
        request.basket_id,
        request.window_start,
        request.window_end
    )

    # Generate temporal insight
    reflection_text = await _generate_insight_text(
        substrate=substrate,
        insight_type='timeboxed_insight',
        agent_context={
            'window_start': request.window_start.isoformat(),
            'window_end': request.window_end.isoformat(),
            'focus_query': request.focus_query
        }
    )

    # Compute substrate hash for window
    substrate_hash = compute_basket_substrate_hash(supabase, request.basket_id)

    # Insert timeboxed_insight
    new_insight = supabase.table('reflections_artifact').insert({
        'basket_id': request.basket_id,
        'workspace_id': workspace_id,
        'reflection_text': reflection_text,
        'substrate_hash': substrate_hash,
        'insight_type': 'timeboxed_insight',
        'substrate_window_start': request.window_start.isoformat(),
        'substrate_window_end': request.window_end.isoformat(),
        'is_current': False,  # timeboxed insights don't use is_current (many per basket)
        'derived_from': _build_substrate_provenance(substrate),
        'computation_timestamp': datetime.utcnow().isoformat()
    }).execute()

    if not new_insight.data:
        raise HTTPException(status_code=500, detail="Failed to create timeboxed insight")

    insight = new_insight.data[0]

    return GenerateTimeboxedInsightResponse(
        insight_id=insight['id'],
        basket_id=insight['basket_id'],
        window_start=request.window_start,
        window_end=request.window_end,
        reflection_text=reflection_text,
        substrate_hash=substrate_hash,
        created_at=insight['created_at']
    )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def _fetch_basket_substrate(supabase, basket_id: str) -> Dict[str, Any]:
    """
    Fetch all substrate for basket (V3.0 compliant).

    V3.0 Changes:
    - context_items merged into blocks table
    - state enum: PROPOSED, ACCEPTED, LOCKED, CONSTANT (not 'ACTIVE')
    - Query for ACCEPTED+ states (excludes PROPOSED/REJECTED)

    V3.1 Semantic Layer:
    - substrate_relationships is a graph edge table (from_block_id -> to_block_id)
    - No direct basket_id - must join through blocks table
    """
    # Query blocks with valid states (ACCEPTED, LOCKED, CONSTANT)
    # Exclude PROPOSED (not yet approved) and REJECTED (invalid)
    blocks = supabase.table('blocks').select('*').eq('basket_id', basket_id).in_('state', ['ACCEPTED', 'LOCKED', 'CONSTANT']).execute()

    dumps = supabase.table('raw_dumps').select('*').eq('basket_id', basket_id).execute()
    events = supabase.table('timeline_events').select('*').eq('basket_id', basket_id).execute()

    # Get relationships: Join through blocks to filter by basket
    # Query relationships where EITHER from_block or to_block is in this basket
    block_ids = [block['id'] for block in blocks.data] if blocks.data else []

    if block_ids:
        # Get relationships connected to any block in this basket
        relationships = supabase.table('substrate_relationships').select('*').in_(
            'from_block_id', block_ids
        ).in_('state', ['ACCEPTED', 'LOCKED', 'CONSTANT']).execute()
    else:
        relationships = type('obj', (object,), {'data': []})()  # Empty result

    return {
        'blocks': blocks.data,
        'dumps': dumps.data,
        'events': events.data,
        'relationships': relationships.data
    }


async def _fetch_basket_substrate_timeboxed(
    supabase,
    basket_id: str,
    window_start: datetime,
    window_end: datetime
) -> Dict[str, Any]:
    """
    Fetch substrate within time window (V3.0 compliant).

    V3.0 Changes:
    - context_items merged into blocks table
    - Query blocks with ACCEPTED+ states only
    """
    # Filter by created_at within window, valid states only
    blocks = supabase.table('blocks').select('*').eq('basket_id', basket_id).in_(
        'state', ['ACCEPTED', 'LOCKED', 'CONSTANT']
    ).gte('created_at', window_start.isoformat()).lte(
        'created_at', window_end.isoformat()
    ).execute()

    dumps = supabase.table('raw_dumps').select('*').eq('basket_id', basket_id).gte(
        'created_at', window_start.isoformat()
    ).lte('created_at', window_end.isoformat()).execute()

    events = supabase.table('timeline_events').select('*').eq('basket_id', basket_id).gte(
        'ts', window_start.isoformat()
    ).lte('ts', window_end.isoformat()).execute()

    return {
        'blocks': blocks.data,
        'dumps': dumps.data,
        'events': events.data
    }


async def _generate_insight_text(
    substrate: Dict[str, Any],
    insight_type: str,
    agent_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate insight text via AI using existing LLM service (V3.0 compliant).

    V3.0 Changes:
    - context_items removed (merged into blocks)
    - All entity/context data now in blocks table
    """
    from services.llm import get_llm

    # Format substrate for LLM
    blocks = substrate.get('blocks', [])
    dumps = substrate.get('dumps', [])
    events = substrate.get('events', [])
    relationships = substrate.get('relationships', [])

    # Build context string
    substrate_text = "# Substrate Context\n\n"

    if blocks:
        substrate_text += f"## Blocks ({len(blocks)} items)\n"
        for block in blocks[:30]:  # Increased limit since blocks now include former context_items
            substrate_text += f"- {block.get('semantic_type', 'unknown')}: {block.get('content', '')[:200]}\n"
        substrate_text += "\n"

    if dumps:
        substrate_text += f"## Raw Dumps ({len(dumps)} items)\n"
        for dump in dumps[:5]:
            substrate_text += f"- {dump.get('body_md', '')[:300]}\n"
        substrate_text += "\n"

    if events:
        substrate_text += f"## Timeline Events ({len(events)} items)\n"
        for event in events[:10]:
            substrate_text += f"- {event.get('kind', 'unknown')}: {event.get('preview', '')[:100]}\n"
        substrate_text += "\n"

    if relationships:
        substrate_text += f"## Relationships ({len(relationships)} connections)\n"
        for rel in relationships[:10]:
            substrate_text += f"- {rel.get('relationship_type', 'unknown')}: {rel.get('from_type', '')} → {rel.get('to_type', '')}\n"
        substrate_text += "\n"

    # Build prompt based on insight type
    if insight_type == 'insight_canon':
        prompt = f"""You are analyzing a knowledge basket to create an Insight Canon - the core understanding of "what matters now".

{substrate_text}

**Task**: Synthesize this substrate into a cohesive insight canon that captures:
1. The central themes and patterns
2. Key tensions or questions emerging
3. What matters most right now in this basket
4. Connections between different pieces of knowledge

Write a clear, direct insight canon (300-500 words) that someone could read to quickly understand what this basket is about."""

    elif insight_type == 'doc_insight':
        doc_title = substrate.get('document_title', 'Untitled')
        doc_content = substrate.get('document_content', '')
        prompt = f"""You are analyzing a document to create a doc_insight - understanding its meaning and purpose.

**Document**: {doc_title}

**Content Preview**:
{doc_content[:1000]}

**Task**: Provide insight into:
1. The document's main purpose and message
2. Key themes or ideas
3. How this fits into the broader knowledge context

Write a concise doc insight (150-300 words)."""

    elif insight_type == 'timeboxed_insight':
        window_start = agent_context.get('window_start') if agent_context else 'unknown'
        window_end = agent_context.get('window_end') if agent_context else 'unknown'
        prompt = f"""You are analyzing a time-boxed window of activity: {window_start} to {window_end}

{substrate_text}

**Task**: Summarize what happened during this time window:
1. What was added or changed
2. Patterns of activity
3. Progress or evolution
4. Notable events or milestones

Write a temporal insight (200-400 words) focused on this specific timeframe."""

    else:
        prompt = f"""Analyze the following context and provide insight:

{substrate_text}

Write a clear insight (200-400 words)."""

    # Call LLM (temperature=1 is default, some models don't support other values)
    llm = get_llm()
    response = await llm.get_text_response(prompt, max_tokens=1000)

    if not response.success:
        # Fallback to structured summary if LLM fails
        return f"Analysis of basket with {len(blocks)} blocks and {len(dumps)} dumps. LLM generation failed: {response.error}"

    return response.content


def _build_substrate_provenance(substrate: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Build derived_from provenance array from substrate (V3.0 compliant).

    V3.0 Changes:
    - context_items removed (merged into blocks)
    - All substrate elements now tracked via blocks, dumps, events
    """
    provenance = []

    for block in substrate.get('blocks', []):
        provenance.append({'type': 'block', 'id': block['id']})

    for dump in substrate.get('dumps', []):
        provenance.append({'type': 'dump', 'id': dump['id']})

    for event in substrate.get('events', []):
        provenance.append({'type': 'timeline_event', 'id': event['id']})

    return provenance
