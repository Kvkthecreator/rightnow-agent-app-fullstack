"""
Narrative job management service.

Handles async narrative generation jobs with from_scaffold and refresh_full modes.
"""
# V3.0 DEPRECATION NOTICE:
# This file contains references to context_items table which was merged into blocks table.
# Entity blocks are now identified by semantic_type='entity'.
# This file is legacy/supporting code - update if actively maintained.


import json
from uuid import uuid4
from typing import Dict, Any, List, Literal, Optional
from pydantic import BaseModel

from app.utils.supabase_client import supabase_client as supabase
from services.clock import now_iso

JobMode = Literal["from_scaffold", "refresh_full"]
JobState = Literal["queued", "running", "done", "error"]

class NarrativeJob(BaseModel):
    job_id: str
    basket_id: str
    mode: JobMode
    include: List[str]
    state: JobState
    progress: int = 0
    narrative: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str

class JobStatus(BaseModel):
    state: JobState
    progress: int
    narrative: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# In-memory job store (could be replaced with DB table)
_jobs: Dict[str, NarrativeJob] = {}

async def start_job(basket_id: str, mode: JobMode, include: List[str], workspace_id: str) -> str:
    """
    Start a narrative generation job.
    
    Args:
        basket_id: Target basket
        mode: from_scaffold or refresh_full
        include: Types to include (blocks, context, documents, raw_dumps)
        workspace_id: Workspace context
        
    Returns:
        job_id: Unique job identifier
    """
    job_id = f"job_narr_{uuid4().hex[:12]}"
    
    job = NarrativeJob(
        job_id=job_id,
        basket_id=basket_id,
        mode=mode,
        include=include,
        state="queued",
        created_at=now_iso(),
        updated_at=now_iso()
    )
    
    _jobs[job_id] = job
    
    # Emit event for job start
    await _emit_job_event("narrative_job.started", {
        "job_id": job_id,
        "basket_id": basket_id,
        "mode": mode,
        "workspace_id": workspace_id
    })
    
    # Start processing asynchronously
    await _process_job(job_id, workspace_id)
    
    return job_id

async def get_job(job_id: str) -> Optional[JobStatus]:
    """Get current job status."""
    job = _jobs.get(job_id)
    if not job:
        return None
    
    return JobStatus(
        state=job.state,
        progress=job.progress,
        narrative=job.narrative,
        error=job.error
    )

async def _process_job(job_id: str, workspace_id: str):
    """Process narrative job (simplified implementation)."""
    job = _jobs.get(job_id)
    if not job:
        return
    
    try:
        # Update to running
        job.state = "running"
        job.progress = 10
        job.updated_at = now_iso()
        
        if job.mode == "from_scaffold":
            await _process_from_scaffold(job, workspace_id)
        elif job.mode == "refresh_full":
            await _process_refresh_full(job, workspace_id)
        
        # Complete
        job.state = "done"
        job.progress = 100
        job.updated_at = now_iso()
        
        await _emit_job_event("narrative_job.completed", {
            "job_id": job_id,
            "basket_id": job.basket_id,
            "workspace_id": workspace_id
        })
        
    except Exception as e:
        job.state = "error"
        job.error = str(e)
        job.updated_at = now_iso()
        
        await _emit_job_event("narrative_job.failed", {
            "job_id": job_id,
            "basket_id": job.basket_id,
            "error": str(e),
            "workspace_id": workspace_id
        })

async def _process_from_scaffold(job: NarrativeJob, workspace_id: str):
    """Process from_scaffold mode - read fresh substrate."""
    job.progress = 30
    
    # Read substrate from DB
    substrate = await _load_substrate(job.basket_id, job.include)
    
    job.progress = 60
    
    # Generate narrative
    narrative = await _generate_narrative(substrate, job.mode)
    
    job.progress = 90
    job.narrative = narrative

async def _process_refresh_full(job: NarrativeJob, workspace_id: str):
    """Process refresh_full mode - refetch everything."""
    job.progress = 20
    
    # Refetch all requested types
    substrate = await _refetch_substrate(job.basket_id, job.include)
    
    job.progress = 50
    
    # Generate narrative
    narrative = await _generate_narrative(substrate, job.mode)
    
    job.progress = 90
    job.narrative = narrative

async def _load_substrate(basket_id: str, include: List[str]) -> Dict[str, Any]:
    """Load substrate components from DB."""
    substrate = {}
    
    for component in include:
        if component == "blocks":
            # TODO: Load actual blocks
            substrate["blocks"] = {"sample_block": {"content": "Sample block content"}}
        elif component == "documents":
            # TODO: Load actual documents
            substrate["documents"] = {"sample_doc": {"title": "Sample Document"}}
        elif component == "context":
            # TODO: Load actual context items
            substrate["context"] = {"sample_context": {"type": "context_item"}}
        elif component == "raw_dumps":
            # TODO: Load actual raw dumps
            substrate["raw_dumps"] = {"sample_dump": {"body": "Sample dump content"}}
    
    return substrate

async def _refetch_substrate(basket_id: str, include: List[str]) -> Dict[str, Any]:
    """Refetch substrate components (more expensive)."""
    # For now, same as load_substrate
    return await _load_substrate(basket_id, include)

async def _generate_narrative(substrate: Dict[str, Any], mode: JobMode) -> Dict[str, Any]:
    """Generate narrative from substrate."""
    # TODO: Call actual narrative intelligence services
    return {
        "title": f"Generated Narrative ({mode})",
        "content": "This is a sample narrative generated from the substrate.",
        "sections": [
            {
                "title": "Overview",
                "content": "Overview of the substrate content."
            },
            {
                "title": "Key Insights", 
                "content": "Key insights derived from the analysis."
            }
        ],
        "metadata": {
            "generation_mode": mode,
            "components_used": list(substrate.keys()),
            "confidence": 0.85
        }
    }

async def _emit_job_event(event_type: str, payload: Dict[str, Any]):
    """Emit job-related event."""
    try:
        from app.utils.db import as_json
        
        supabase.table("events").insert(as_json({
            "id": str(uuid4()),
            "basket_id": payload.get("basket_id"),
            "workspace_id": payload.get("workspace_id"),
            "kind": event_type,
            "payload": payload
        })).execute()
    except Exception as e:
        print(f"Failed to emit job event {event_type}: {e}")