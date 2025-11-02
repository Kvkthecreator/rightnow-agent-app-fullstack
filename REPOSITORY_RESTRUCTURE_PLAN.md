# Repository Restructure Plan: Two Products, Clean Separation

**Date**: 2025-11-02
**Goal**: Separate Work Platform (v4.0) from Context Management API (Enterprise)

---

## Strategic Clarity (Confirmed)

### Primary Product: Work Platform (v4.0) - Priority #1
- **What**: AI agent work management platform
- **Users**: Teams, researchers, knowledge workers
- **Features**: Work sessions, unified governance, agent execution, work review UI
- **Status**: Needs to be built (complete v4.0)
- **Domain**: `yarnnn.com` or `app.yarnnn.com`

### Secondary Product: Context Management API (Enterprise) - Roll Back
- **What**: Backend memory/context infrastructure for developers
- **Users**: Enterprises, developers building AI apps
- **Features**: Substrate storage, semantic search, MCP/OpenAI integrations, API access
- **Status**: Roll back to pre-v4.0 commit (when it was working)
- **Domain**: `enterprise.yarnnn.com` or separate repo

---

## The Key Git Commit: Pre-v4.0 Working State

**Identified Commit**: `b735c693` or `d6ddff77` (right before v4.0 docs refactor)

**At this commit**:
- ✅ Backend/frontend wired and working
- ✅ Context management features complete
- ✅ UI for baskets, blocks, documents, governance, timeline
- ✅ Proposal-based governance working
- ✅ Auth, workspace management working
- ❌ No work_sessions/unified_approval (added in v4.0 refactor `c4a1c159`)

**Frontend Routes** (at `b735c693`):
```
web/app/
├── baskets/          # Context browser (working)
├── dashboard/        # Overview (working)
├── governance/       # Proposals (working)
├── memory/           # Memory capture (working)
├── workspace/        # Workspace management (working)
├── mcp/              # MCP integration (working)
└── ...
```

**This is perfect for Enterprise API product** - just needs rebranding from consumer UI to B2B infrastructure UI.

---

## Proposed Repository Structure

### Option A: Mono-Repo with Product Separation ⭐ **Recommended**

```
rightnow-agent-app-fullstack/            # Main repo (keep as-is)
│
├── platform/                            # NEW: Work Platform (v4.0)
│   ├── api/                             # NEW: Clean v4.0 API
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── work_sessions.py     # NEW: Work management
│   │       │   ├── governance.py        # NEW: Unified approval
│   │       │   ├── baskets.py           # Reuse from shared/
│   │       │   └── ...
│   │       └── ...
│   │
│   ├── web/                             # NEW: Work Platform UI
│   │   └── app/
│   │       ├── work-requests/           # NEW: Create tasks
│   │       ├── work-review/             # NEW: Review agent outputs
│   │       ├── baskets/                 # Reuse UI patterns from enterprise
│   │       └── ...
│   │
│   └── agents/                          # Existing: yarnnn-claude-agents
│       └── src/
│           ├── research/
│           ├── content/
│           └── reporting/
│
├── enterprise/                          # NEW: Context Management API
│   ├── api/                             # Rollback of current api/ to b735c693
│   │   └── src/
│   │       ├── routes/                  # From pre-v4.0 commit
│   │       │   ├── baskets.py
│   │       │   ├── blocks.py
│   │       │   ├── proposals.py         # Keep proposal governance
│   │       │   ├── search.py
│   │       │   └── workspaces.py
│   │       └── ...
│   │
│   ├── web/                             # Rollback of current web/ to b735c693
│   │   └── app/
│   │       ├── dashboard/               # Rebrand for enterprise
│   │       ├── baskets/                 # Context browser
│   │       ├── governance/              # Proposals
│   │       ├── api-keys/                # NEW: Add API key UI
│   │       └── mcp/                     # MCP integration guide
│   │
│   ├── mcp-server/                      # Existing: yarnnn-mcp-server
│   │   └── src/
│   │
│   └── openai-compat/                   # Existing: yarnnn-openai-apps
│       └── src/
│
├── shared/                              # Shared by both products
│   ├── substrate/                       # Layer 1: Blocks, docs, timeline
│   ├── models/                          # Database models
│   └── database/                        # Supabase client
│
└── docs/
    ├── platform/                        # Work Platform docs
    ├── enterprise/                      # Enterprise API docs
    └── canon/                           # v4.0 canon
```

**Benefits**:
- Single repo for version control
- Shared substrate code (no duplication)
- Clear product boundaries
- Can deploy services independently
- Both products use same database/substrate

**Deployment Mapping**:
| Render Service | Repo Path | Domain |
|----------------|-----------|--------|
| `rightnow-agent-platform-api` | `platform/api/` | `api.yarnnn.com` |
| `yarnnn-claude-agents` | `platform/agents/` | (internal) |
| `yarnnn-enterprise-api` | `enterprise/api/` | `enterprise.yarnnn.com` |
| `yarnnn-mcp-server` | `enterprise/mcp-server/` | `mcp.yarnnn.com` |
| `yarnnn-openai-apps` | `enterprise/openai-compat/` | `openai.yarnnn.com` |

Plus Vercel:
| Vercel Project | Repo Path | Domain |
|----------------|-----------|--------|
| `yarnnn-platform-web` | `platform/web/` | `yarnnn.com` or `app.yarnnn.com` |
| `yarnnn-enterprise-web` | `enterprise/web/` | `enterprise.yarnnn.com` |

---

### Option B: Separate Repos by Product

**Repo 1**: `yarnnn-platform` (new repo)
- Work Platform (v4.0)
- Clean build from scratch
- Depends on `yarnnn-shared` package

**Repo 2**: `yarnnn-enterprise` (rollback of current repo to `b735c693`)
- Context Management API
- Already working at that commit
- Depends on `yarnnn-shared` package

**Repo 3**: `yarnnn-shared` (extract from current)
- Substrate models/services
- Database client
- Published as Python package

**Benefits**:
- Complete separation
- Can version independently
- Clear ownership

**Drawbacks**:
- Need to publish/manage shared package
- Three repos to maintain
- Harder to make substrate changes (affects both)

---

## Recommended Approach: Option A (Mono-Repo)

**Why**:
1. Substrate is shared - both products use same blocks/documents/timeline
2. Easier to refactor shared code
3. Single source of truth for database migrations
4. Can still deploy services independently via Render config
5. You're already comfortable with monorepo (current setup)

---

## Implementation Plan

### Phase 1: Restructure Repository (Week 1)

**Goal**: Organize current repo into product-separated structure

**Steps**:

1. **Create new directories**:
   ```bash
   mkdir -p platform/api platform/web platform/agents
   mkdir -p enterprise/api enterprise/web enterprise/mcp-server enterprise/openai-compat
   mkdir -p shared/substrate shared/models shared/database
   ```

2. **Roll back Enterprise to working state**:
   ```bash
   # Create enterprise/ from pre-v4.0 commit
   git show b735c693:api/ > /tmp/api-backup
   git show b735c693:web/ > /tmp/web-backup

   # Copy to enterprise/
   # (detailed steps below)
   ```

3. **Extract shared substrate code**:
   ```bash
   # Move substrate-related code to shared/
   mv api/src/app/models/block.py shared/models/
   mv api/src/app/models/document.py shared/models/
   mv api/src/services/substrate/ shared/substrate/
   ```

4. **Set up platform/ for fresh v4.0 build**:
   ```bash
   # Initialize clean platform structure
   # No code yet - will build in Phase 2
   ```

5. **Update imports**:
   - Enterprise API imports from `shared/`
   - Platform API imports from `shared/`

6. **Update deployment configs**:
   - `deployment/render-enterprise-api.yaml`
   - `deployment/render-platform-api.yaml`
   - Update build commands to point to new paths

**Deliverable**: Restructured repo with clear product separation

---

### Phase 2: Deploy Enterprise (Week 2)

**Goal**: Get Enterprise API running on rolled-back code

**Steps**:

1. **Verify enterprise/ code works**:
   ```bash
   cd enterprise/api
   python -m pytest  # Run tests
   uvicorn main:app --reload  # Test locally
   ```

2. **Rebrand enterprise frontend**:
   - Update landing page copy (B2B positioning)
   - Add API key management UI
   - Add usage dashboard (if needed)
   - MCP integration guide
   - Update nav/branding to "enterprise.yarnnn.com"

3. **Deploy to Render**:
   - `yarnnn-enterprise-api` → `enterprise/api/`
   - `yarnnn-mcp-server` → `enterprise/mcp-server/` (already deployed)
   - `yarnnn-openai-apps` → `enterprise/openai-compat/` (already deployed)

4. **Deploy to Vercel**:
   - `yarnnn-enterprise-web` → `enterprise/web/`
   - Domain: `enterprise.yarnnn.com`

5. **Test end-to-end**:
   - Create workspace
   - Create basket
   - Add blocks via API
   - Test MCP integration (ChatGPT/Claude connection)
   - Test OpenAI compatibility

**Deliverable**: Working Enterprise API at `enterprise.yarnnn.com`

---

### Phase 3: Build Work Platform (Weeks 3-6)

**Goal**: Clean v4.0 implementation for Work Platform

**Steps**:

1. **Week 3: API Routes** (user-flow-first approach)
   - Design work request creation flow (sketch UI first)
   - Create `/api/work/sessions` routes
   - Create `/api/governance/review` route
   - Wire UnifiedApprovalOrchestrator
   - Test with Postman/curl

2. **Week 4: Agent Integration**
   - Update `yarnnn-claude-agents` to create work_sessions
   - Implement research/content/reporting agents
   - Test agent → work_session → artifact flow
   - Verify governance review works

3. **Week 5: Platform UI**
   - Work request creation screen
   - Work review screen (artifact approval)
   - Dashboard with pending work
   - Agent status/history

4. **Week 6: Polish & Deploy**
   - Risk assessment service
   - Auto-approval logic
   - Workspace policies
   - Deploy to `yarnnn.com` or `app.yarnnn.com`

**Deliverable**: Working v4.0 Work Platform

---

## Detailed: Rolling Back Enterprise to Pre-v4.0

### Step-by-Step Rollback

**1. Identify exact commit to use**:
```bash
# Check what was working
git log --oneline --before="2025-01-15" | head -20

# Likely candidates:
# b735c693 - Merge pull request (research framework)
# d6ddff77 - Export YARNNN agents framework
# e297ef45 - Restyle workspace change request filters
```

**2. Create enterprise/ from that commit**:
```bash
# Save current state
git stash

# Create enterprise directories
mkdir -p enterprise/api enterprise/web

# Extract api/ from pre-v4.0 commit
git show b735c693:api | tar -xz -C enterprise/api/

# Extract web/ from pre-v4.0 commit
git show b735c693:web | tar -xz -C enterprise/web/

# OR use git checkout specific paths:
git checkout b735c693 -- api/
mv api enterprise/api
git checkout b735c693 -- web/
mv web enterprise/web

git reset HEAD  # Unstage
```

**3. Remove v4.0 scaffolding from enterprise**:
```bash
cd enterprise/api

# Delete v4.0-specific files
rm -rf src/app/governance/unified_approval.py
rm -rf src/app/work/
rm -rf src/app/routes/work_sessions.py

# Keep v3.1 files
# ✓ Keep: baskets.py, blocks.py, proposals.py, documents.py, etc.
```

**4. Update enterprise branding**:
```bash
cd enterprise/web

# Update landing page
# Change "yarnnn — Turn chaos into context"
# To "YARNNN Enterprise — Context API for AI Applications"

# Update nav/footer
# Remove consumer-focused copy
# Add API-focused messaging
```

**5. Test enterprise locally**:
```bash
cd enterprise/api
cp ../../.env .env  # Copy environment
uvicorn main:app --reload --port 8010

cd enterprise/web
npm install
npm run dev -- --port 3010
```

**6. Commit restructured repo**:
```bash
git add enterprise/ platform/ shared/
git commit -m "Restructure: Separate Work Platform and Enterprise API

- Roll back enterprise/ to pre-v4.0 working state (commit b735c693)
- Create platform/ for clean v4.0 build
- Extract shared substrate code to shared/
- Update deployment configs for new structure
"
```

---

## What Gets Deleted (Eventually)

Once restructure complete:

**Delete from root**:
- `api/` → Moved to `enterprise/api/` or deleted
- `web/` → Moved to `enterprise/web/` and `platform/web/`
- `services/universal_work_tracker.py` → Not needed in either product
- `services/canonical_queue_processor.py` → Not needed (work_sessions replaces it)

**Keep in root**:
- `docs/` → Stays (with subdirectories for each product)
- `deployment/` → Stays (updated configs)
- `.env.example`, `README.md`, etc.

---

## Migration Checklist

### Pre-Restructure
- [ ] Identify exact commit for enterprise rollback (likely `b735c693`)
- [ ] Document what frontend routes existed and worked
- [ ] Backup current state (git branch `backup-pre-restructure`)

### Restructure Phase
- [ ] Create `platform/`, `enterprise/`, `shared/` directories
- [ ] Roll back `enterprise/` to pre-v4.0 commit
- [ ] Extract shared code to `shared/`
- [ ] Remove v4.0 scaffolding from enterprise
- [ ] Update imports in enterprise code
- [ ] Rebrand enterprise frontend (B2B messaging)
- [ ] Test enterprise locally
- [ ] Update deployment configs

### Enterprise Deployment
- [ ] Deploy enterprise API to Render
- [ ] Deploy enterprise web to Vercel
- [ ] Configure `enterprise.yarnnn.com` domain
- [ ] Test MCP integration works
- [ ] Test OpenAI compatibility works
- [ ] Verify end-to-end (workspace → basket → blocks → MCP)

### Platform Development
- [ ] Design work request flow (sketch UI)
- [ ] Create work_sessions API routes
- [ ] Create governance review route
- [ ] Update agents to use work_sessions
- [ ] Build work review UI
- [ ] Deploy platform to `yarnnn.com`

---

## Questions to Answer Before Starting

1. **Exact Rollback Commit**: Should I use `b735c693`, `d6ddff77`, or earlier?
   - Can you test that commit locally to verify it works?

2. **Root Directory Cleanup**: After restructure, delete root `api/` and `web/` directories?
   - Or keep them temporarily during transition?

3. **Shared Package**: Should `shared/` be a Python package, or just shared folder?
   - Package: Can version independently, but more setup
   - Folder: Simpler, but both products must be in same repo

4. **Deployment Timeline**: Deploy enterprise first (week 2), then build platform (weeks 3-6)?
   - Or build platform locally first, then deploy both together?

5. **Current Deployments**: Can I touch running Render services during restructure?
   - Or must they stay operational while we reorganize?

---

## Next Steps (Immediate)

Once you confirm the approach, I will:

1. **Identify exact pre-v4.0 commit** to use for enterprise rollback
2. **Test that commit locally** to verify it works
3. **Create restructure branch** (`feature/two-product-structure`)
4. **Execute restructure** following the plan above
5. **Update deployment configs** for new paths
6. **Commit and push** restructured repo

Then you can review the restructured repo and we proceed with:
- Week 2: Deploy enterprise
- Weeks 3-6: Build platform v4.0

---

## Final Recommendation

**Do the restructure NOW**, before building v4.0:

**Why**:
- Enterprise can run on proven v3.1 code (already worked)
- Platform gets clean slate (no legacy pollution)
- Shared substrate properly extracted
- Clear product boundaries from day one

**How**: Follow Phase 1-3 plan above (6 weeks total)

**Alternative** (if you need enterprise running immediately):
- Deploy current repo as-is to `enterprise.yarnnn.com` (works at `b735c693`)
- Build platform in separate repo (`yarnnn-platform`)
- Restructure later if needed

What's your preference?
