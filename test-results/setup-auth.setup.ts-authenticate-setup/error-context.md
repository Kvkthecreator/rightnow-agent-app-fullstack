# Test info

- Name: authenticate
- Location: /Users/macbook/rightnow-agent-app-fullstack/tests/setup/auth.setup.ts:6:6

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

    at /Users/macbook/rightnow-agent-app-fullstack/tests/setup/auth.setup.ts:47:14
```

# Page snapshot

```yaml
- paragraph: Checking configuration...
```

# Test source

```ts
   1 | import { test as setup, expect } from '@playwright/test';
   2 | import { createClient } from '@supabase/supabase-js';
   3 |
   4 | const authFile = 'tests/setup/.auth/user.json';
   5 |
   6 | setup('authenticate', async ({ page }) => {
   7 |   // Create a test user through Supabase
   8 |   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://galytxxkrbksilekmhcw.supabase.co';
   9 |   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc1NTc2MywiZXhwIjoyMDYyMzMxNzYzfQ.0oAdZeTn_k3p-29Hy8z1v5YYGpjBeqML0amz5bcAS6g';
  10 |   
  11 |   const supabase = createClient(
  12 |     supabaseUrl,
  13 |     serviceRoleKey,
  14 |     {
  15 |       auth: {
  16 |         autoRefreshToken: false,
  17 |         persistSession: false
  18 |       }
  19 |     }
  20 |   );
  21 |
  22 |   // Create or use existing test user
  23 |   const testEmail = 'e2e.test@yarnnn.com';
  24 |   const testPassword = 'e2eTestPassword123!';
  25 |
  26 |   try {
  27 |     // Try to create test user
  28 |     const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  29 |       email: testEmail,
  30 |       password: testPassword,
  31 |       options: {
  32 |         emailRedirectTo: undefined // Skip email confirmation
  33 |       }
  34 |     });
  35 |
  36 |     if (signUpError && !signUpError.message.includes('already registered')) {
  37 |       throw signUpError;
  38 |     }
  39 |   } catch (error) {
  40 |     // User might already exist, continue
  41 |   }
  42 |
  43 |   // Navigate to login page
  44 |   await page.goto('/login');
  45 |
  46 |   // Fill in login form
> 47 |   await page.fill('input[type="email"]', testEmail);
     |              ^ Error: page.fill: Test timeout of 30000ms exceeded.
  48 |   await page.fill('input[type="password"]', testPassword);
  49 |   
  50 |   // Submit login form
  51 |   await page.click('button[type="submit"]');
  52 |
  53 |   // Wait for successful login (redirect to dashboard or authenticated state)
  54 |   await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  55 |
  56 |   // Verify we're authenticated by checking for user elements
  57 |   await expect(page.getByRole('button', { name: /profile|user|account/i })).toBeVisible({ timeout: 5000 });
  58 |
  59 |   // Save authenticated state
  60 |   await page.context().storageState({ path: authFile });
  61 | });
  62 |
  63 | setup.describe.configure({ mode: 'serial' });
```