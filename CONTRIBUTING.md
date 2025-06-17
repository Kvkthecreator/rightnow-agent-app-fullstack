# Contributing to yarnnn

Please run `make lint`, `make format`, and `make tests` before opening a pull request.

When changing Supabase keys or environment variables, start the backend and confirm the ingestion worker logs:

```
[SUPABASE DEBUG] Loaded Supabase key role: service_role
```

If you see a different role, your deployment is misconfigured and will fail with permission errors.

