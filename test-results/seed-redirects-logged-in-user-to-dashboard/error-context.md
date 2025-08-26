# Test info

- Name: redirects logged-in user to dashboard
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/seed.spec.ts:6:5

# Error details

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/work?tab=dashboard" until "load"
  navigated to "http://localhost:3000/login"
============================================================
    at /Users/macbook/rightnow-agent-app-fullstack/tests/seed.spec.ts:8:16
```

# Page snapshot

```yaml
- alert
- heading "Sign in" [level=2]
- paragraph: Continue to yarnnn
- img "yarnnn logo"
- button "Continue with Google"
- textbox "Email for magic link"
- button "Send Magic Link"
- paragraph:
  - text: By continuing, you agree to our
  - link "Terms":
    - /url: /terms
  - text: and
  - link "Privacy Policy":
    - /url: /privacy
  - text: .
- text: "intervals: 0"
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 |
   3 | // This test relies on `storageState.json` which holds a logged-in session.
   4 | // It verifies that the login page immediately redirects the authenticated
   5 | // user to the dashboard.
   6 | test("redirects logged-in user to dashboard", async ({ page }) => {
   7 |     await page.goto("/login");
>  8 |     await page.waitForURL("**/work?tab=dashboard");
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
   9 |     await expect(page.locator("text=Design System Preview")).toBeVisible();
  10 | });
  11 |
```