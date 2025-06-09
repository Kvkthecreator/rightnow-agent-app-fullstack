# 🧪 Playwright Setup for Codex-Paired Testing

This file documents the recommended testing loop when using Codex to generate or modify features. 

---
## ✅ 1. Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

---
## 🔐 2. Authenticate Once via Dev Auth

```bash
npx playwright codegen --save-storage=storageState.json http://localhost:3000
```

1. Log in using your test user (e.g., Google or magic link).
2. Close the window after redirecting to dashboard.

> This saved session will be reused for all tests.

---
## 🧪 3. Run Basket Creation Test

```bash
npx playwright test tests/basket-create.spec.ts
```

This test creates a real basket in your database and confirms the flow visually and structurally.

---
## 🧼 Notes
- `.gitignore` already skips committing the `storageState.json`
- You can create additional tests in `/tests/` as your app evolves
- `playwright.config.ts` automatically boots the local server if not running

---
## 🌱 Next: Seeding Example Data
You can add `tests/seed.ts` for batch data seeding or fake users. Or let Codex generate auto-tests that cover your flows.
