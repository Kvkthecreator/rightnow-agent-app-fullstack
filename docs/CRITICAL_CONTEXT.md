# CRITICAL: This is a Full-Stack Context OS

## Architecture
- Frontend: Next.js at yarnnn.com (Vercel)
- Backend: Python FastAPI at api.yarnnn.com (Render)
- Database: Supabase with Context OS schema
- This is a MONOREPO - both frontend and backend matter

## Never Forget
1. Python backend is DEPLOYED and RUNNING at api.yarnnn.com
2. Backend has 22+ agents implementing Context OS
3. Database has full block lifecycle (PROPOSED→ACCEPTED→LOCKED)
4. Frontend should NEVER use mocks - always call real backend
5. Both /api (Python) and /web (Next.js) need updates

## Context OS Flow
raw_dump → Python Agent → PROPOSED blocks → User Review → ACCEPTED → Document Composition

## When Making Changes
- Always check BOTH frontend and backend
- Test the complete flow, not just UI
- Verify events are emitted
- Ensure block states are managed
- Check agent attribution

Save this and reference it in EVERY future session