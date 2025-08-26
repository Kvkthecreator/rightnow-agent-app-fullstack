# Test info

- Name: redirects to canonical basket id preserving subpath
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/canonical_redirect.spec.ts:3:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected pattern: /\/baskets\/(?!not-real)[^/]+\/reflections$/
Received string:  "http://localhost:3000/baskets/not-real/reflections"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    8 × locator resolved to <html lang="en" class="__variable_e8ce0c __variable_5899e0 __variable_5f64cf">…</html>
      - unexpected value "http://localhost:3000/baskets/not-real/reflections"

    at /Users/macbook/rightnow-agent-app-fullstack/tests/baskets/canonical_redirect.spec.ts:5:22
```

# Page snapshot

```yaml
- alert
- text: Something went wrong.
- img
- text: 1 error
- button "Hide Errors":
  - img
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test'
  2 |
  3 | test('redirects to canonical basket id preserving subpath', async ({ page }) => {
  4 |   await page.goto('/baskets/not-real/reflections')
> 5 |   await expect(page).toHaveURL(/\/baskets\/(?!not-real)[^/]+\/reflections$/)
    |                      ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
  6 | })
  7 |
```