import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'tests/setup/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Create a test user through Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://galytxxkrbksilekmhcw.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbHl0eHhrcmJrc2lsZWttaGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njc1NTc2MywiZXhwIjoyMDYyMzMxNzYzfQ.0oAdZeTn_k3p-29Hy8z1v5YYGpjBeqML0amz5bcAS6g';
  
  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Create or use existing test user
  const testEmail = 'e2e.test@yarnnn.com';
  const testPassword = 'e2eTestPassword123!';

  try {
    // Try to create test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined // Skip email confirmation
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }
  } catch (error) {
    // User might already exist, continue
  }

  // Navigate to login page
  await page.goto('/login');

  // Fill in login form
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  
  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for successful login (redirect to dashboard or authenticated state)
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });

  // Verify we're authenticated by checking for user elements
  await expect(page.getByRole('button', { name: /profile|user|account/i })).toBeVisible({ timeout: 5000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});

setup.describe.configure({ mode: 'serial' });