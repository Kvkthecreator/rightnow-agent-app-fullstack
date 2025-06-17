# Supabase Environment Variables

This guide defines all Supabase related environment variables used in **yarnnn**.  Follow these definitions to avoid configuration drift between the frontend and backend.

## Frontend variables

These are injected into the browser bundle and must contain **least privilege** keys.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base URL for your Supabase project. Used by browser clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous key for browser access. |

## Backend variables

These are only used on the server and **must never** be exposed to client code.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Base URL for backend ingestion jobs and worker processes. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key with elevated privileges. |

## Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or logs.
- Backend modules should authenticate with `SUPABASE_SERVICE_ROLE_KEY`.
- Frontend modules should use `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- Write RLS policies assuming the anon key for clients and the service role key for servers.

## Deployment checklist

- Ensure your Render or Vercel environment includes all of the keys above.
- PR reviewers must verify that Supabase environment variables match this document.

## Boundary diagram

```
[Browser] -- anon key --> [Backend API] -- service role key --> [Supabase]
```

This file is the single source of truth for Supabase environment variable usage.

## Troubleshooting

If you see errors like `permission denied for schema public`, double-check that
`SUPABASE_SERVICE_ROLE_KEY` is set correctly and that the service role has
sufficient privileges. These errors typically mean the backend is using the
anon key or an incorrect role.

## Runtime Role Validation

The ingestion worker decodes the `SUPABASE_SERVICE_ROLE_KEY` at startup and logs
the `role` claim. You should see a log line similar to:

```
[SUPABASE DEBUG] Loaded Supabase key role: service_role
```

If the logged role is anything other than `service_role`, the backend will lack
the required permissions and will raise errors like `permission denied for schem
a public`.

