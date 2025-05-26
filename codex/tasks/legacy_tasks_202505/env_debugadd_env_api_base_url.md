## codex/tasks/env_debugadd_env_api_base_url.md

What I Want

Add support for dynamic API base URL in the Next.js frontend so that all API requests use the correct backend URL depending on the environment (localhost or production).
Use an environment variable: NEXT_PUBLIC_API_BASE_URL
Update all direct fetches to backend endpoints (e.g., /profile_analyzer) to use this base URL.
Example:
Locally: NEXT_PUBLIC_API_BASE_URL=http://localhost:10000
Production: NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-RENDER-URL
Ensure code is robust, easy to update, and clearly documented.
Context / Relevant Files

All API requests in the frontend (especially /profile_analyzer)
Typical fetch looks like:
const res = await fetch('/profile_analyzer', ...)
Using Next.js (App Router).
Current file of interest:
web/app/profile/jamie-test/page.tsx
Step-by-step Instructions

Create or update .env.local in the web/ directory:
NEXT_PUBLIC_API_BASE_URL=http://localhost:10000
On Vercel:
Go to your Vercel project → Settings → Environment Variables.
Add:
NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-RENDER-URL
Redeploy the project.
Update all fetch calls in the frontend (example in page.tsx):
Change from:
fetch('/profile_analyzer', { ... })
to:

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL + '/profile_analyzer';
fetch(apiUrl, { ... })
Document this pattern (in code comments and/or README.md if desired).
Test both locally and on Vercel to ensure correct API behavior.
Acceptance Criteria

All API requests use NEXT_PUBLIC_API_BASE_URL.
No more 405/404 errors due to wrong host/path in any environment.
Local and production environment work identically (except for the base URL).
Easy to update backend URL in the future via environment variables.
