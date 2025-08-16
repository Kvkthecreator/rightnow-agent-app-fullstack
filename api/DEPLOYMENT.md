# Backend Deployment Guide

## 🚀 Quick Fix Summary

The backend was failing on Render with `ModuleNotFoundError: No module named 'databases'`. This has been fixed by:

1. **✅ Added database dependencies** to `requirements.txt`
2. **✅ Fixed DATABASE_URL handling** for Render's postgres:// format  
3. **✅ Created required tables** for Manager Agent system
4. **✅ Implemented proper connection pooling** with lifecycle management
5. **✅ Added health checks** for deployment verification

## 🔧 Render.com Deployment Steps

### 1. Environment Variables
Set these in your Render dashboard:

```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname  # Provided by Render
SUPABASE_SERVICE_ROLE_KEY=your_key_here              # For Supabase integration
SUPABASE_URL=https://your-project.supabase.co        # Base Supabase URL
SUPABASE_JWKS_ISSUER=https://your-project.supabase.co/auth/v1
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/keys
SUPABASE_JWT_AUD=authenticated                       # Supabase's default audience
```

### 2. Run Database Migrations

After the first successful deployment, run migrations:

```bash
# Option A: Run directly on Render (via SSH or console)
python run_migrations.py

# Option B: Connect locally and run migrations
DATABASE_URL="postgresql://..." python run_migrations.py
```

### 3. Verify Deployment

Test the deployment with our verification script:

```bash
# Test against your Render URL
python test_deployment.py https://your-app.onrender.com

# Test locally
python test_deployment.py http://localhost:8000
```

## 🗂️ Database Schema

The Manager Agent system uses these tables:

### Core Tables
- `idempotency_keys` - Prevents duplicate request processing
- `basket_deltas` - Stores BasketDelta payloads from Manager analysis  
- `basket_events` - Events for Supabase Realtime notifications

### Migration Files
- `migrations/001_create_core_tables.sql` - Base schema (workspaces, baskets, etc.)
- `migrations/002_basket_change_management.sql` - Manager Agent tables

## 🤖 Manager Agent API

### POST /api/baskets/{basket_id}/work
Submit a basket change request for Manager Agent analysis.

**Request:**
```json
{
  "request_id": "unique-request-id", 
  "basket_id": "basket-123",
  "intent": "analyze dump",
  "sources": [
    {"type": "text", "content": "analyze this content"},
    {"type": "raw_dump", "id": "dump-456"}
  ]
}
```

**Response (BasketDelta):**
```json
{
  "delta_id": "delta-789",
  "basket_id": "basket-123", 
  "summary": "Found 3 context blocks to create",
  "changes": [
    {
      "entity": "context_block",
      "id": "block-001",
      "from_version": 0,
      "to_version": 1, 
      "diff": "CREATE: New context block"
    }
  ],
  "recommended_actions": [
    {
      "type": "APPLY_ALL",
      "target": "context_block"
    }
  ],
  "confidence": 0.85,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/baskets/{basket_id}/deltas
List all proposed deltas for a basket.

### POST /api/baskets/{basket_id}/apply/{delta_id}  
Apply a specific delta to the basket.

## 🔍 Health Checks

- `GET /` - Basic health check
- `GET /health/db` - Database connectivity check

## 🐛 Troubleshooting

### ModuleNotFoundError: No module named 'databases'
**Fixed!** The `databases[postgresql]` and `asyncpg` packages are now in requirements.txt.

### Database connection issues
1. Check `DATABASE_URL` environment variable is set correctly
2. Ensure Render PostgreSQL addon is attached
3. Test with: `GET /health/db`

### Import errors
The services use dynamic imports to handle the monorepo structure. If you see import errors:
1. Check that `sys.path` additions are working
2. Verify file structure matches expected paths

### API endpoints returning 500
1. Check database connection: `GET /health/db`
2. Verify tables exist by running migrations
3. Check logs for specific error messages

## 📝 Development

### Run locally
```bash
cd api
pip install -r requirements.txt
DATABASE_URL="postgresql://user:pass@localhost/dbname" uvicorn src.app.agent_server:app --reload
```

### Run tests
```bash
python test_deployment.py
```

### Add new migrations
1. Create new `.sql` file in `migrations/`
2. Use naming pattern: `003_description.sql`
3. Run `python run_migrations.py`

## 🔄 System Architecture

```
Frontend (Next.js) 
    ↓ POST /api/baskets/{id}/work
Backend (FastAPI)
    ↓ Manager Agent orchestration
Services (idempotency, deltas, events)
    ↓ Database operations  
PostgreSQL (via databases + asyncpg)
    ↓ Events table
Supabase Realtime (frontend notifications)
```

The Manager Agent system ensures:
- **Idempotent requests** via `request_id` tracking
- **Transactional safety** with proper rollback
- **Real-time updates** via event publishing  
- **Version management** for conflict resolution