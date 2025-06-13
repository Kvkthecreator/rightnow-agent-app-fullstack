# Database Hardening & Drift-Check

This repo now uses **Alembic** for versioned migrations and a
GitHub Action (`.github/workflows/db_drift.yml`) that compares the live
Supabase schema against the migration-generated schema, failing CI on
any drift.

## Day-to-day workflow
```bash
# create & edit code
cd api
alembic revision -m "feature XYZ" --autogenerate
alembic upgrade head   # run locally
pytest -q
git add .
git commit -m "feat: xyz"
# open PR – CI runs drift check
```
… (keep the rest of the README contents)

## Local quick-start

```bash
# spin up a disposable Postgres
docker compose up -d db

# run migrations
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
alembic -c api/alembic.ini upgrade head
```
