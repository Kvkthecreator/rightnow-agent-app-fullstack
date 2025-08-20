# Context OS Monorepo Architecture

## Overview
This monorepo implements the **Context OS** with a Python FastAPI backend (`api.yarnnn.com`), a Next.js frontend (`yarnnn.com`), and a Supabase database.  
All services run in production; development mirrors the same topology.

## Deployment

┌──────────────┐ HTTPS ┌────────────────────┐ SQL ┌──────────────┐
│ yarnnn.com │◄────────────►│ api.yarnnn.com │◄──────────►│ Supabase │
│ (Next.js) │ │ (FastAPI, Render) │ │ Database │
│ Vercel │ │ │ │ │
└──────────────┘ └────────────────────┘ └──────────────┘

- **Frontend:** Next.js (Vercel)  
- **Backend:** FastAPI (Render)  
- **Database:** Supabase (Postgres + RLS)  

## Substrates
- **Baskets** – container scope  
- **Dumps** – raw captures (files/text)  
- **Blocks** – structured interpretations  
- **Documents** – composed outputs  
- **Context Items** – semantic connectors  

These are peers in the substrate; agents operate across them.

## Backend APIs
- **Agents:** `/api/agents/*`  
- **Baskets:** `/api/baskets/new`, `/api/baskets/ingest`  
- **Dumps:** `/api/dumps/new`  
- **Blocks:** `/api/blocks/*`  
- **Documents:** `/api/documents`
- **Events:** WebSocket endpoints for real-time updates  

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