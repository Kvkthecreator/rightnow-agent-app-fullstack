## 📄 Task Title

Implement Supabase Auth + Session Redirect

## 🏁 Goal

Enable Google login using Supabase and protect routes by redirecting unauthenticated users to `/login`. Also redirect logged-in users away from `/login`.

---

## 🧠 Prompt to Codex

### 1. Setup Supabase Client

Create a shared Supabase client:

**`web/lib/supabaseClient.ts`**

```ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { type SupabaseClient } from '@supabase/supabase-js';

export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

---

### 2. Update Login Handler

Update `signInWithGoogle` inside `web/app/login/page.tsx`:

```ts
import { createClient } from '@/lib/supabaseClient';

const supabase = createClient();

function signInWithGoogle() {
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  });
}
```

---

### 3. Add Redirect from `/login` if Logged In

Wrap `web/app/login/page.tsx` content with:

```ts
const session = supabase.auth.getSession();
if (session?.data?.session) {
  router.push("/demo");
  return null;
}
```

---

### 4. Create Middleware Redirect (Optional Advanced)

Create a simple middleware:

**`web/middleware.ts`**

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const session = req.cookies.get('sb-access-token');

  const protectedPaths = ['/demo'];
  const isProtected = protectedPaths.some((path) => url.pathname.startsWith(path));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/demo/:path*'],
};
```

---

## ✅ Success Criteria

* ✅ Clicking Google login redirects to Supabase auth and back
* ✅ If session exists, user is redirected from `/login` to `/demo`
* ✅ If session is missing and user accesses `/demo`, redirected to `/login`
* ✅ `/demo` loads normally after successful login

---

## ⚠️ Notes

* This does not create a user profile in your DB (can be added later)
* SSR-protected pages (like `/profile`) would require `getServerSideProps` — not in scope here
* This works only in browser environment — SSR-safe setup later if needed
