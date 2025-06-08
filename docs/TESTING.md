# 🧪 Testing Yarn (Basket + Context Blocks)

## ✅ Frontend: Jest (Local + Codex)
- Install dependencies: `npm install`
- Run tests: `npm run test`
- Tests located in: `/tests/**/*.test.ts`

## ✅ Backend: Pytest (Local + Codex)
- Requires a Supabase or reachable PostgreSQL DB
- Add `.env` file at root with:

```
DATABASE_URL=postgresql://postgres:<your_password>@<your-supabase-host>:5432/postgres
```

- Run with: `pytest -q`

## Skipping Logic
- If `DATABASE_URL` is not valid or fails to connect, backend tests will be skipped automatically.
- This makes the test suite **Codex-capable** and **CI/CD safe**.
