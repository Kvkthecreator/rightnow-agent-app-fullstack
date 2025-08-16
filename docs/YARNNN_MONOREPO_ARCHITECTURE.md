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
- **Documents:** `/api/document-composition`  
- **Events:** WebSocket endpoints for real-time updates  

## Frontend
- Connects to backend via `NEXT_PUBLIC_API_BASE_URL`  
- Uses shared DTOs from `shared/contracts/*`  
- Consumes WebSocket event streams for real-time updates  

## Development Setup
```bash
# Backend
cd api && uvicorn src.app.agent_server:app --reload

# Frontend
cd web && npm run dev

# Database
supabase start