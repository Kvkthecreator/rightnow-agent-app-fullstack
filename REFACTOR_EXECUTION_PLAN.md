# Refactor Execution Plan: Mono-Repo Restructure

**Date**: 2025-11-02
**Complexity**: Medium (mostly file moving, minimal new code)
**Estimated Time**: 1-2 days (8-16 hours total)

---

## Executive Summary: This is NOT a Big Rewrite

### What This Actually Is

**80% file moving** + **15% import updates** + **5% new code**

**What we're NOT doing**:
- ❌ Rewriting substrate logic
- ❌ Changing database schema
- ❌ Rebuilding agents from scratch
- ❌ Throwing away v4.0 work

**What we ARE doing**:
- ✅ Moving files to new directories (`platform/`, `enterprise/`, `shared/`)
- ✅ Updating import paths (automated find/replace)
- ✅ Creating ~200 lines of API route wrappers (not complex logic)
- ✅ Rolling back Enterprise to working state (b735c693)

### The Trick: UnifiedApprovalOrchestrator Already Exists

**Key realization**: The hard part (unified governance logic) is already coded (485 lines in [unified_approval.py](api/src/app/governance/unified_approval.py:1-485))

**All we need**: Thin API route wrapper to call it

```python
# This is ALL the "new code" we need for v4.0 governance
@router.post("/work/sessions/{session_id}/review")
async def review_work_session(
    session_id: UUID,
    decision: WorkReviewDecision,
    user: dict = Depends(verify_jwt)
):
    orchestrator = UnifiedApprovalOrchestrator(supabase)
    result = await orchestrator.review_work_session(
        work_session_id=session_id,
        user_id=user['sub'],
        decision=decision
    )
    return result
```

**That's it.** 20 lines, calls existing 485-line orchestrator.

---

## Refactor Breakdown by Time

| Phase | Description | Time | Complexity | Risk |
|-------|-------------|------|------------|------|
| **1. Directory Setup** | Create folders | 30 min | Trivial | None |
| **2. Extract Shared** | Move substrate to `shared/` | 2-3 hours | Medium | Low |
| **3. Create Enterprise** | Roll back to b735c693 | 1-2 hours | Easy | Low |
| **4. Create Platform** | Current code → `platform/` | 1 hour | Easy | Low |
| **5. Wire v4.0 Routes** | Create thin API wrappers | 2-3 hours | Medium | Medium |
| **6. Update Imports** | Find/replace paths | 1 hour | Easy | Low |
| **7. Test Locally** | Smoke test both products | 1-2 hours | Easy | Low |
| **8. Update Deployment** | Render/Vercel configs | 30 min | Easy | Low |
| **Total** | | **8-13 hours** | | |

**Can be done in 1-2 days** with focused work.

---

## Phase 1: Directory Setup (30 minutes)

### What We're Doing

Creating the folder structure. No code changes yet.

### Commands

```bash
cd /Users/macbook/rightnow-agent-app-fullstack

# Create platform structure
mkdir -p platform/api/src/{routes,services,governance,work}
mkdir -p platform/web
mkdir -p platform/agents

# Create enterprise structure
mkdir -p enterprise/api/src/routes
mkdir -p enterprise/web
mkdir -p enterprise/mcp-server
mkdir -p enterprise/openai-compat

# Create shared structure
mkdir -p shared/substrate/{routes,services,models}
mkdir -p shared/database/{migrations,client}
mkdir -p shared/utils
mkdir -p shared/agents  # P1/P3/P4 agents used by both

# Create docs structure
mkdir -p docs/platform
mkdir -p docs/enterprise

echo "✅ Directory structure created"
```

### Validation

```bash
# Verify structure
tree -L 3 -d platform enterprise shared
```

**Risk**: None (just creating folders)

---

## Phase 2: Extract Shared Code (2-3 hours)

### What We're Doing

Moving substrate code (used by both products) from `api/` to `shared/`.

This is the core 68% of codebase that both products depend on.

### Step 2.1: Move Shared Models (15 min)

```bash
# Copy models to shared
cp api/src/app/models/block.py shared/substrate/models/
cp api/src/app/models/basket.py shared/substrate/models/
cp api/src/app/models/document.py shared/substrate/models/
cp api/src/app/models/event.py shared/substrate/models/
cp api/src/app/models/context.py shared/substrate/models/
cp api/src/app/models/raw_dump.py shared/substrate/models/

# Create __init__.py for package
cat > shared/substrate/models/__init__.py << 'EOF'
"""Shared substrate models."""
from .block import Block
from .basket import Basket
from .document import Document
from .event import Event
from .context import ContextHierarchy

__all__ = ["Block", "Basket", "Document", "Event", "ContextHierarchy"]
EOF

echo "✅ Models moved to shared/"
```

### Step 2.2: Move Substrate Routes (1 hour)

**These routes are used by both products** (Enterprise for API access, Platform for work context):

```bash
# Move substrate routes
cp api/src/app/routes/baskets.py shared/substrate/routes/
cp api/src/app/routes/blocks.py shared/substrate/routes/
cp api/src/app/routes/block_lifecycle.py shared/substrate/routes/
cp api/src/app/routes/document_composition.py shared/substrate/routes/
cp api/src/app/routes/reflections.py shared/substrate/routes/
cp api/src/app/routes/p3_insights.py shared/substrate/routes/
cp api/src/app/routes/p4_composition.py shared/substrate/routes/
cp api/src/app/routes/p4_canon.py shared/substrate/routes/
cp api/src/app/routes/events.py shared/substrate/routes/
cp api/src/app/routes/dump_new.py shared/substrate/routes/
cp api/src/app/routes/dump_status.py shared/substrate/routes/
cp api/src/app/routes/projection.py shared/substrate/routes/
cp api/src/app/routes/narrative_intelligence.py shared/substrate/routes/
cp api/src/app/routes/context_intelligence.py shared/substrate/routes/

# Create __init__.py
cat > shared/substrate/routes/__init__.py << 'EOF'
"""Shared substrate routes."""
# Routes will be imported by product-specific API servers
EOF

echo "✅ Substrate routes moved to shared/"
```

### Step 2.3: Move Substrate Services (1 hour)

```bash
# Move services to shared
cp api/src/services/embedding.py shared/substrate/services/
cp api/src/services/semantic_primitives.py shared/substrate/services/
cp api/src/services/substrate_ops.py shared/substrate/services/
cp api/src/services/substrate_diff.py shared/substrate/services/
cp api/src/services/llm.py shared/substrate/services/
cp api/src/services/events.py shared/substrate/services/
cp api/src/services/events_consumer.py shared/substrate/services/
cp api/src/services/deltas.py shared/substrate/services/
cp api/src/services/idempotency.py shared/substrate/services/
cp api/src/services/upserts.py shared/substrate/services/

# Create __init__.py
cat > shared/substrate/services/__init__.py << 'EOF'
"""Shared substrate services."""
EOF

echo "✅ Services moved to shared/"
```

### Step 2.4: Move Shared Utils (30 min)

```bash
# Move utils
cp api/src/app/utils/*.py shared/utils/

# Create __init__.py
cat > shared/utils/__init__.py << 'EOF'
"""Shared utilities."""
EOF

echo "✅ Utils moved to shared/"
```

### Step 2.5: Move Database Migrations (15 min)

```bash
# Move migrations to shared
cp -r supabase/migrations/* shared/database/migrations/

# Copy Supabase client
cp api/src/app/utils/supabase_client.py shared/database/client.py

echo "✅ Database code moved to shared/"
```

### Validation After Phase 2

```bash
# Check shared structure
ls -la shared/substrate/models/
ls -la shared/substrate/routes/
ls -la shared/substrate/services/
ls -la shared/utils/
ls -la shared/database/

# Should see all the files we copied
```

**Risk**: Low (files copied, originals still exist in `api/`)

---

## Phase 3: Create Enterprise from Rollback (1-2 hours)

### What We're Doing

Rolling back `enterprise/` to commit b735c693 (pre-v4.0 working state), then wiring it to use `shared/`.

### Step 3.1: Extract Pre-v4.0 State (30 min)

```bash
# Create temporary branch to extract old state
git checkout b735c693

# Copy api/ state to enterprise/
cp -r api enterprise/api-rollback
cp -r web enterprise/web-rollback

# Return to main
git checkout main

# Clean up temp files
mv enterprise/api-rollback enterprise/api
mv enterprise/web-rollback enterprise/web

echo "✅ Extracted b735c693 state to enterprise/"
```

### Step 3.2: Update Enterprise Imports to Use Shared (30 min)

**This is find/replace, not rewriting logic**:

```bash
cd enterprise/api

# Find all imports of models
grep -r "from app.models" . --include="*.py" > /tmp/imports.txt

# Replace with shared imports
# Old: from app.models.block import Block
# New: from shared.substrate.models.block import Block

# Can be automated with sed:
find . -name "*.py" -type f -exec sed -i '' 's/from app\.models\./from shared.substrate.models./g' {} +
find . -name "*.py" -type f -exec sed -i '' 's/from services\./from shared.substrate.services./g' {} +
find . -name "*.py" -type f -exec sed -i '' 's/from app\.utils\./from shared.utils./g' {} +

echo "✅ Enterprise imports updated to use shared/"
```

### Step 3.3: Add MCP/OpenAI Routes (Current State) (30 min)

**Key insight**: MCP routes didn't exist at b735c693, but we need them for Enterprise.

```bash
# Copy MCP/OpenAI routes from current api/
cp api/src/app/routes/mcp_auth.py enterprise/api/src/routes/
cp api/src/app/routes/mcp_oauth.py enterprise/api/src/routes/
cp api/src/app/routes/mcp_inference.py enterprise/api/src/routes/
cp api/src/app/routes/mcp_activity.py enterprise/api/src/routes/
cp api/src/app/routes/openai_apps.py enterprise/api/src/routes/
cp api/src/app/routes/integration_tokens.py enterprise/api/src/routes/

# Update imports in these files to use shared/
cd enterprise/api
find src/routes/mcp_*.py src/routes/openai_apps.py -exec sed -i '' 's/from app\.models\./from shared.substrate.models./g' {} +
find src/routes/mcp_*.py src/routes/openai_apps.py -exec sed -i '' 's/from app\.utils\./from shared.utils./g' {} +

echo "✅ MCP/OpenAI routes added to enterprise/"
```

### Step 3.4: Copy MCP Server and OpenAI Compat (15 min)

```bash
# Copy existing MCP server (yarnnn-mcp-server)
cp -r mcp-server/* enterprise/mcp-server/

# Copy existing OpenAI compatibility layer (yarnnn-openai-apps)
cp -r openai-compat/* enterprise/openai-compat/

echo "✅ MCP server and OpenAI compat moved to enterprise/"
```

### Validation After Phase 3

```bash
cd enterprise/api
python -c "from shared.substrate.models.block import Block; print('✅ Imports work')"

# Try starting the server
uvicorn main:app --reload --port 8010
# Should start without import errors
```

**Risk**: Low (b735c693 was working, we're just moving it and updating imports)

---

## Phase 4: Create Platform Structure (1 hour)

### What We're Doing

Organizing current v4.0 code into `platform/`. This keeps all the v4.0 infrastructure.

### Step 4.1: Copy Current API to Platform (15 min)

```bash
# Platform gets current state (has v4.0 infrastructure)
cp -r api platform/api-current

# Remove enterprise-specific routes
cd platform/api-current/src/routes
rm mcp_*.py openai_apps.py integration_tokens.py

# Keep platform-specific routes
# agents.py, agent_run.py, agent_memory.py (platform uses these)
# work_status.py (will be replaced by work_sessions.py in Phase 5)

cd /Users/macbook/rightnow-agent-app-fullstack
mv platform/api-current platform/api

echo "✅ Platform API created from current state"
```

### Step 4.2: Update Platform Imports (30 min)

```bash
cd platform/api

# Update imports to use shared/
find . -name "*.py" -type f -exec sed -i '' 's/from app\.models\./from shared.substrate.models./g' {} +
find . -name "*.py" -type f -exec sed -i '' 's/from services\./from shared.substrate.services./g' {} +
find . -name "*.py" -type f -exec sed -i '' 's/from app\.utils\./from shared.utils./g' {} +

echo "✅ Platform imports updated to use shared/"
```

### Step 4.3: Keep v4.0 Governance (Already Exists!)

```bash
# Platform keeps UnifiedApprovalOrchestrator
# api/src/app/governance/unified_approval.py stays in platform/api/src/app/governance/

# This is the 485 lines of governance logic we don't need to rewrite
ls platform/api/src/app/governance/unified_approval.py
# Should exist

echo "✅ v4.0 governance preserved in platform/"
```

### Step 4.4: Copy Current Frontend (15 min)

```bash
# Copy current web/ to platform/web/
cp -r web platform/web

# Note: We'll need to build work review UI later, but structure is ready
echo "✅ Platform frontend structure created"
```

### Validation After Phase 4

```bash
cd platform/api
python -c "from shared.substrate.models.block import Block; print('✅ Imports work')"
python -c "from app.governance.unified_approval import UnifiedApprovalOrchestrator; print('✅ v4.0 governance accessible')"
```

**Risk**: Low (current code works, we're just moving it)

---

## Phase 5: Wire v4.0 Routes (NEW CODE - 2-3 hours)

### What We're Doing

**This is the only "new" coding**: Creating thin API route wrappers that call existing orchestrators.

### Step 5.1: Create work_sessions.py (1-2 hours)

**File**: `platform/api/src/app/routes/work_sessions.py`

**Complexity**: Low (just API glue, logic already exists)

**What it does**:
- Create work session (call existing work tracker)
- Get work session status (query work_sessions table)
- List work sessions (query with filters)

**Code to write** (~100 lines):

```python
"""
Work Sessions API - YARNNN v4.0

Replaces api/src/app/routes/work_status.py (v2.1)
Uses work_sessions table instead of agent_processing_queue
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from shared.utils.jwt import verify_jwt
from shared.utils.supabase_client import supabase_admin_client as supabase
from app.work.models import WorkSession, WorkArtifact

router = APIRouter(prefix="/api/work/sessions", tags=["work-sessions"])


class CreateWorkSessionRequest(BaseModel):
    """Request to create new work session."""
    task_description: str
    basket_id: UUID
    agent_type: str  # 'research', 'content', 'reporting'
    context: Optional[dict] = {}


class WorkSessionResponse(BaseModel):
    """Work session with artifacts."""
    id: UUID
    task_description: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    artifacts: List[dict]


@router.post("/", response_model=WorkSessionResponse)
async def create_work_session(
    request: CreateWorkSessionRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Create new work session.

    Agent will execute task and produce artifacts for review.
    """
    user_id = user.get('sub')

    # Get user's workspace
    workspace_response = supabase.table("workspace_memberships").select(
        "workspace_id"
    ).eq("user_id", user_id).limit(1).execute()

    if not workspace_response.data:
        raise HTTPException(status_code=403, detail="User has no workspace")

    workspace_id = workspace_response.data[0]['workspace_id']

    # Create work session in database
    session_response = supabase.table("work_sessions").insert({
        "task_description": request.task_description,
        "basket_id": str(request.basket_id),
        "workspace_id": workspace_id,
        "user_id": user_id,
        "agent_type": request.agent_type,
        "status": "pending",
        "context": request.context,
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    session = session_response.data[0]

    # TODO: Trigger agent execution (integrate with yarnnn-claude-agents)
    # For now, session is created and waits for agent pickup

    return WorkSessionResponse(
        id=session['id'],
        task_description=session['task_description'],
        status=session['status'],
        created_at=session['created_at'],
        completed_at=None,
        artifacts=[]
    )


@router.get("/{session_id}", response_model=WorkSessionResponse)
async def get_work_session(
    session_id: UUID,
    user: dict = Depends(verify_jwt)
):
    """Get work session details with artifacts."""
    user_id = user.get('sub')

    # Get session
    session_response = supabase.table("work_sessions").select(
        "*"
    ).eq("id", str(session_id)).eq("user_id", user_id).single().execute()

    if not session_response.data:
        raise HTTPException(status_code=404, detail="Work session not found")

    session = session_response.data

    # Get artifacts
    artifacts_response = supabase.table("work_artifacts").select(
        "*"
    ).eq("work_session_id", str(session_id)).execute()

    artifacts = artifacts_response.data or []

    return WorkSessionResponse(
        id=session['id'],
        task_description=session['task_description'],
        status=session['status'],
        created_at=session['created_at'],
        completed_at=session.get('completed_at'),
        artifacts=artifacts
    )


@router.get("/", response_model=List[WorkSessionResponse])
async def list_work_sessions(
    user: dict = Depends(verify_jwt),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, description="Max results", le=100),
    offset: int = Query(0, description="Offset for pagination")
):
    """List user's work sessions."""
    user_id = user.get('sub')

    # Build query
    query = supabase.table("work_sessions").select(
        "*"
    ).eq("user_id", user_id).order("created_at", desc=True)

    if status:
        query = query.eq("status", status)

    query = query.range(offset, offset + limit - 1)

    sessions_response = query.execute()
    sessions = sessions_response.data or []

    # Get artifacts for each session
    results = []
    for session in sessions:
        artifacts_response = supabase.table("work_artifacts").select(
            "*"
        ).eq("work_session_id", session['id']).execute()

        results.append(WorkSessionResponse(
            id=session['id'],
            task_description=session['task_description'],
            status=session['status'],
            created_at=session['created_at'],
            completed_at=session.get('completed_at'),
            artifacts=artifacts_response.data or []
        ))

    return results
```

**Validation**:
```bash
cd platform/api
python -c "from app.routes.work_sessions import router; print('✅ work_sessions.py valid')"
```

### Step 5.2: Create work_review.py (1 hour)

**File**: `platform/api/src/app/routes/work_review.py`

**Complexity**: Trivial (calls UnifiedApprovalOrchestrator)

**What it does**: Single endpoint that calls existing 485-line orchestrator

**Code to write** (~80 lines):

```python
"""
Work Review API - YARNNN v4.0 Unified Governance

Single endpoint for work review → applies approved artifacts to substrate.
Calls UnifiedApprovalOrchestrator for governance logic.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Optional
from uuid import UUID

from shared.utils.jwt import verify_jwt
from shared.utils.supabase_client import supabase_admin_client as supabase
from app.governance.unified_approval import (
    UnifiedApprovalOrchestrator,
    WorkReviewDecision,
    ArtifactDecision,
    WorkReviewResult
)

router = APIRouter(prefix="/api/work/review", tags=["work-review"])


class ReviewRequest(BaseModel):
    """Request to review work session."""
    work_quality: str  # 'approved' or 'rejected'
    feedback: Optional[str] = None
    artifacts: Dict[str, str]  # artifact_id → 'apply_to_substrate' | 'save_as_draft' | 'reject'
    artifact_feedback: Dict[str, str] = {}


@router.post("/{session_id}", response_model=dict)
async def review_work_session(
    session_id: UUID,
    request: ReviewRequest,
    user: dict = Depends(verify_jwt)
):
    """
    Review work session and apply approved artifacts to substrate.

    Single user review → dual effect:
    1. Work quality assessment
    2. Substrate mutation application (if approved)

    This is the core v4.0 unified governance endpoint.
    """
    user_id = user.get('sub')

    # Verify user has access to this work session
    session_response = supabase.table("work_sessions").select(
        "user_id, workspace_id"
    ).eq("id", str(session_id)).single().execute()

    if not session_response.data:
        raise HTTPException(status_code=404, detail="Work session not found")

    session = session_response.data

    # Verify user owns the work session or is workspace admin
    if session['user_id'] != user_id:
        # Check if user is workspace admin
        membership_response = supabase.table("workspace_memberships").select(
            "role"
        ).eq("user_id", user_id).eq("workspace_id", session['workspace_id']).execute()

        if not membership_response.data or membership_response.data[0]['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied")

    # Convert request to WorkReviewDecision
    artifact_decisions = {
        UUID(artifact_id): ArtifactDecision(decision)
        for artifact_id, decision in request.artifacts.items()
    }

    decision = WorkReviewDecision(
        work_quality=request.work_quality,
        feedback=request.feedback,
        artifacts=artifact_decisions,
        artifact_feedback={UUID(k): v for k, v in request.artifact_feedback.items()}
    )

    # Call UnifiedApprovalOrchestrator (this is where the 485 lines of logic runs)
    orchestrator = UnifiedApprovalOrchestrator(supabase)
    result = await orchestrator.review_work_session(
        work_session_id=session_id,
        user_id=UUID(user_id),
        decision=decision
    )

    # Return result
    return {
        "status": result.status,
        "reason": result.reason,
        "artifacts_applied": result.artifacts_applied,
        "substrate_mutations": [str(m) for m in result.substrate_mutations],
        "rejected_artifacts": [str(r) for r in result.rejected_artifacts]
    }
```

**Validation**:
```bash
cd platform/api
python -c "from app.routes.work_review import router; print('✅ work_review.py valid')"
```

### Step 5.3: Register Routes in Main App (15 min)

**File**: `platform/api/src/app/main.py` (or wherever routes are registered)

```python
from app.routes.work_sessions import router as work_sessions_router
from app.routes.work_review import router as work_review_router

app.include_router(work_sessions_router)
app.include_router(work_review_router)
```

### Validation After Phase 5

```bash
cd platform/api
uvicorn main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/api/work/sessions  # Should work
curl http://localhost:8000/docs  # Check OpenAPI docs
```

**Risk**: Medium (new code, but thin wrappers calling tested logic)

---

## Phase 6: Update Imports Across Codebase (1 hour)

### What We're Doing

Global find/replace to update all import paths to use `shared/`, `platform/`, `enterprise/`.

### Automated Script

```bash
#!/bin/bash
# update_imports.sh

echo "Updating imports to use new structure..."

# Update shared/ imports
find platform enterprise -name "*.py" -type f -exec sed -i '' \
    -e 's/from app\.models\./from shared.substrate.models./g' \
    -e 's/from services\./from shared.substrate.services./g' \
    -e 's/from app\.utils\./from shared.utils./g' \
    {} +

# Update Python path configs
find platform enterprise -name "*.py" -type f -exec sed -i '' \
    -e 's|sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))|sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../../../"))|g' \
    {} +

echo "✅ Imports updated"
```

### Manual Verification

```bash
# Check for any remaining old imports
grep -r "from app.models" platform enterprise shared --include="*.py"
# Should return nothing

grep -r "from services." platform enterprise shared --include="*.py" | grep -v "from shared.substrate.services"
# Should return nothing (except comments)
```

**Risk**: Low (automated, can be tested before committing)

---

## Phase 7: Test Locally (1-2 hours)

### What We're Testing

Both products should start without errors and basic endpoints should work.

### Test Enterprise API

```bash
cd enterprise/api

# Install dependencies
poetry install

# Start server
uvicorn main:app --reload --port 8010

# In another terminal, test endpoints
curl http://localhost:8010/api/baskets  # Should work
curl http://localhost:8010/mcp/auth/validate  # Should work
curl http://localhost:8010/docs  # Check OpenAPI docs
```

**Expected**: Server starts, substrate endpoints work, MCP endpoints work

### Test Platform API

```bash
cd platform/api

# Install dependencies
poetry install

# Start server
uvicorn main:app --reload --port 8000

# In another terminal, test endpoints
curl http://localhost:8000/api/work/sessions  # Should work (new v4.0)
curl http://localhost:8000/api/baskets  # Should work (shared substrate)
curl http://localhost:8000/docs  # Check OpenAPI docs
```

**Expected**: Server starts, work_sessions endpoints work, substrate endpoints work

### Test Shared Imports

```bash
# Test shared imports work from both products
cd platform/api
python -c "from shared.substrate.models.block import Block; print('✅ Platform → Shared imports work')"

cd ../../enterprise/api
python -c "from shared.substrate.models.block import Block; print('✅ Enterprise → Shared imports work')"
```

### Validation Checklist

- [ ] Enterprise API starts without errors
- [ ] Enterprise API serves substrate routes (baskets, blocks, documents)
- [ ] Enterprise API serves MCP routes (mcp/auth, mcp/oauth, mcp/inference)
- [ ] Platform API starts without errors
- [ ] Platform API serves work_sessions routes (new v4.0)
- [ ] Platform API serves work_review route (calls UnifiedApprovalOrchestrator)
- [ ] Platform API serves substrate routes (baskets, blocks, documents)
- [ ] Both products can import from `shared/`

**If any test fails**: Fix imports, retry

**Risk**: Low (smoke tests, not full integration tests)

---

## Phase 8: Update Deployment Configs (30 min)

### What We're Doing

Update Render and Vercel configs to deploy from subdirectories.

### Render Services

**Update each service config** (via Render dashboard or YAML):

**Platform API**:
```yaml
# render-platform-api.yaml
services:
  - type: web
    name: rightnow-platform-api
    env: python
    rootDir: platform/api  # <-- KEY CHANGE
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_KEY
        sync: false
```

**Enterprise API**:
```yaml
# render-enterprise-api.yaml
services:
  - type: web
    name: yarnnn-enterprise-api
    env: python
    rootDir: enterprise/api  # <-- KEY CHANGE
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Agent Server**:
```yaml
# render-platform-agents.yaml
services:
  - type: worker
    name: yarnnn-claude-agents
    env: python
    rootDir: platform/agents  # <-- KEY CHANGE
    buildCommand: pip install -r requirements.txt
    startCommand: python agent_server.py
```

**MCP Server**:
```yaml
# render-mcp-server.yaml
services:
  - type: web
    name: yarnnn-mcp-server
    env: node
    rootDir: enterprise/mcp-server  # <-- KEY CHANGE
    buildCommand: npm install
    startCommand: node index.js
```

### Vercel Projects

**Update via Vercel dashboard** → Project Settings → Root Directory:

**Platform Web**:
- Root Directory: `platform/web`
- Build Command: `npm run build`
- Output Directory: `.next`

**Enterprise Web**:
- Root Directory: `enterprise/web`
- Build Command: `npm run build`
- Output Directory: `.next`

### Validation

```bash
# Test Render config locally (if using render.yaml)
render-cli config validate deployment/render-platform-api.yaml
render-cli config validate deployment/render-enterprise-api.yaml

# Commit deployment configs
git add deployment/*.yaml
git commit -m "Update deployment configs for mono-repo structure"
```

**Risk**: Low (Render/Vercel support subdirectory builds)

---

## Phase 9: Commit and Push (30 min)

### What We're Doing

Commit the restructured repo to GitHub.

### Commit Strategy

**Option A: Single Large Commit** (simpler)
```bash
# Stage everything
git add platform/ enterprise/ shared/ docs/

# Commit
git commit -m "Restructure: Mono-repo with product separation

- Separate Work Platform (platform/) and Enterprise API (enterprise/)
- Extract shared substrate to shared/ (68% of codebase)
- Roll back enterprise/ to b735c693 (pre-v4.0 working state)
- Add v4.0 work_sessions and work_review routes to platform/
- Update all imports to use new structure
- Configure subdirectory deployment for Render/Vercel

Breaking Changes:
- API routes moved: api/src/app/routes → shared/substrate/routes
- Import paths changed: app.models → shared.substrate.models
- Deployment configs updated to use subdirectories

Migration Guide: See MONO_REPO_ARCHITECTURE_ANALYSIS.md
"
```

**Option B: Incremental Commits** (safer, easier to review)
```bash
# Commit 1: Create structure
git add platform/ enterprise/ shared/
git commit -m "Create mono-repo directory structure"

# Commit 2: Move shared code
git add shared/
git commit -m "Extract shared substrate to shared/"

# Commit 3: Create enterprise
git add enterprise/
git commit -m "Roll back enterprise/ to b735c693 working state"

# Commit 4: Create platform
git add platform/
git commit -m "Organize platform/ with v4.0 infrastructure"

# Commit 5: Add v4.0 routes
git add platform/api/src/app/routes/work_sessions.py
git add platform/api/src/app/routes/work_review.py
git commit -m "Add v4.0 work_sessions and work_review routes"

# Commit 6: Update deployment
git add deployment/
git commit -m "Update deployment configs for subdirectory builds"
```

### Push to GitHub

```bash
# Push to main (or create branch first)
git push origin main

# Or create feature branch
git checkout -b feature/mono-repo-restructure
git push origin feature/mono-repo-restructure
```

### Validation

```bash
# Verify push succeeded
git log --oneline | head -5

# Check GitHub
open https://github.com/your-org/rightnow-agent-app-fullstack
```

**Risk**: None (can always revert commits)

---

## Summary: What We Actually Built

### New Code Written

| File | Lines | Complexity | Purpose |
|------|-------|------------|---------|
| `work_sessions.py` | ~100 | Low | Thin wrapper for work session CRUD |
| `work_review.py` | ~80 | Trivial | Calls UnifiedApprovalOrchestrator |
| `__init__.py` files | ~50 | Trivial | Python package setup |
| Import updates | ~500 edits | Trivial | Automated find/replace |
| **Total New Code** | ~200 lines | | |

**Key Point**: We wrote ~200 lines of new code, not thousands.

### Existing Code Reused

| Component | Lines | Action |
|-----------|-------|--------|
| UnifiedApprovalOrchestrator | 485 | Kept, just wired API route |
| Substrate routes | ~5,000 | Moved to shared/ |
| Substrate services | ~3,000 | Moved to shared/ |
| Models | ~1,500 | Moved to shared/ |
| Database schema | N/A | No changes |
| Agent pipeline | ~8,000 | Moved to platform/ |

**Key Point**: 80% of work is file moving, not rewriting.

---

## Estimated Timeline

### If Done Sequentially (One Person)

- **Phase 1**: 30 min
- **Phase 2**: 3 hours
- **Phase 3**: 2 hours
- **Phase 4**: 1 hour
- **Phase 5**: 3 hours
- **Phase 6**: 1 hour
- **Phase 7**: 2 hours
- **Phase 8**: 30 min
- **Phase 9**: 30 min

**Total**: ~13 hours (1.5-2 days of focused work)

### If Done in Parallel (Two People)

**Person 1**: Enterprise rollback (Phases 1-3)
- 30 min + 3 hours + 2 hours = **5.5 hours**

**Person 2**: Platform v4.0 routes (Phases 1, 4-5)
- 30 min + 1 hour + 3 hours = **4.5 hours**

**Together**: Phases 6-9
- 1 hour + 2 hours + 30 min + 30 min = **4 hours**

**Total**: **10 hours** (1-1.5 days with two people)

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|------------|------------|
| 1. Directory Setup | None | Just creating folders |
| 2. Extract Shared | Low | Files copied, originals stay |
| 3. Enterprise Rollback | Low | b735c693 was working |
| 4. Platform Structure | Low | Current code works |
| 5. Wire v4.0 Routes | Medium | New code, but thin wrappers |
| 6. Update Imports | Low | Automated, can test first |
| 7. Local Testing | Low | Smoke tests only |
| 8. Deployment Configs | Low | Render/Vercel support subdirs |
| 9. Commit and Push | None | Can revert if needed |

**Overall Risk**: Low-Medium

**Rollback Strategy**: If anything fails, we still have the original `api/` directory. Can revert commits and try again.

---

## Questions Before We Start

1. **Should I execute this refactor now**, or do you want to review the plan first?

2. **Do you want incremental commits** (Option B) or **single large commit** (Option A)?

3. **Should I start with Phase 1-2** (extract shared code) and pause for review?

4. **Any specific concerns** about the plan that I should address first?

5. **Do you want me to create a backup branch** before starting?

---

## Next Steps (If Approved)

1. ✅ Create backup branch: `git checkout -b backup-pre-mono-repo`
2. ✅ Create feature branch: `git checkout -b feature/mono-repo-restructure`
3. ✅ Execute Phase 1-2: Create structure, extract shared code
4. ✅ Test imports work
5. ✅ Execute Phase 3-4: Create enterprise and platform
6. ✅ Execute Phase 5: Wire v4.0 routes
7. ✅ Test locally (Phase 7)
8. ✅ Commit and push
9. ✅ Update deployment configs (Phase 8)
10. ✅ Deploy to staging/production

---

**Ready to execute when you are. This is a 1-2 day refactor, not a multi-week rewrite.**
