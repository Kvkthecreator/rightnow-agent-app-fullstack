# Contributing to yarnnn

Please run `make lint`, `make format`, and `make tests` before opening a pull request.

When changing Supabase keys or environment variables, ensure the backend boots correctly and that requests succeed.


### \ud83e\udde0 Architectural Rule: SSR vs CSR Fetching

When adding a new data loader:

- For **server-side pages (Next.js server components)**:
  - Use `lib/server/[domain].ts`
  - Use `createServerComponentClient` from `@supabase/auth-helpers-nextjs`
- For **client components / actions**:
  - Use `lib/api/[domain].ts`
  - Use fetch with `/api/…` routes as needed
- Avoid unnecessary `/app/api/...` proxy routes unless used for client-side fetch

Follow examples in:
- `lib/server/baskets.ts`
- `lib/api/baskets.ts`
