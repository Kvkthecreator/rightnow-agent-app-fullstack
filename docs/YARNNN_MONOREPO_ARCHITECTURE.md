# Context OS Monorepo Architecture

## Overview
This monorepo implements the **Context OS** with a Python FastAPI backend (`api.yarnnn.com`), a Next.js frontend (`yarnnn.com`), and a Supabase database.  
All services run in production; development mirrors the same topology.

## Deployment (Async Intelligence Model)

┌──────────────┐ Direct  ┌──────────────┐ Queue  ┌────────────────────┐ SQL ┌──────────────┐
│ yarnnn.com   │◄────────►│  Supabase    │◄──────►│ api.yarnnn.com     │◄───►│  Supabase    │
│ (Next.js)    │  Read    │  Database    │ Poll   │ (FastAPI, Render)  │     │  Database    │
│ Vercel       │          │              │        │                    │     │              │
└──────────────┘          └──────────────┘        └────────────────────┘     └──────────────┘
       │                                                     │
       └─────────────────────────────────────────────────────┘
                          Immediate writes (dumps only)

- **Frontend:** Next.js (Vercel) - Immediate user responses, raw dump creation
- **Agent Backend:** FastAPI (Render) - Async intelligence processing via queue
- **Database:** Supabase (Postgres + RLS) - Single source of truth + queue
- **Flow:** User → Immediate → Queue → Async Intelligence → Progressive UI  

## Substrates
- **Baskets** – container scope  
- **Dumps** – raw captures (files/text)  
- **Blocks** – structured interpretations  
- **Documents** – composed outputs  
- **Context Items** – semantic connectors  

These are peers in the substrate; agents operate across them.

## API Endpoints

### Frontend APIs (Vercel - Immediate Response)
- **Dumps:** `POST /api/dumps/new` - Raw capture only
- **Baskets:** `POST /api/baskets/ingest` - Onboarding orchestration
- **Read:** `GET /api/baskets/*/projection` - Display processed substrate

### Agent APIs (Render - Async Processing)
- **Queue:** Agent polls for processing work
- **Substrate:** Creates blocks, context_items, relationships via RPCs
- **Events:** Emits timeline events on completion

### Architecture Flow
```
User → Vercel API → Raw Dumps → Queue → Render Agents → Substrate → Vercel UI
```  

## Frontend
- Connects to backend via `NEXT_PUBLIC_API_BASE_URL`  
- Uses shared contracts from root `/shared/contracts/*` (accessible via `@shared/*` imports)
- Consumes WebSocket event streams for real-time updates

## Shared Contracts
- **Location:** `/shared/contracts/` (root level for monorepo access)
- **Frontend Access:** Import via `@shared/contracts/*` 
- **Backend Access:** Python adapter in `/api/src/contracts/__init__.py`
- **TypeScript Types:** Core contracts for baskets, dumps, blocks, documents, memory
- **Monorepo Pattern:** Shared between `/web` (frontend) and `/api` (backend)  

## Development Setup
```bash
# Backend
cd api && uvicorn src.app.agent_server:app --reload

# Frontend
cd web && npm run dev

# Database
supabase start