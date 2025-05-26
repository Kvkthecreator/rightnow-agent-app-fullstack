## fix_auth_redirect.md
# 📄 Task Title
Fix Login Redirect Logic for Protected Routes

---

## 🎯 Goal
Ensure users who try to access protected routes like `/profile-create` are:
1. Redirected to login if not authenticated
2. Returned to their original destination after login
fix_auth_redirect.md

---

## 🧠 Prompt to Codex

Update the authentication logic to fix redirect issues. Specifically:

### 🔐 Protected Route Behavior
In all protected routes (like `/profile-create`):
- Check if the user is unauthenticated
- If so, store the current pathname in `localStorage` as `postLoginRedirect`
- Redirect them to `/login`
- Only redirect after confirming session state is loaded

Use:
```ts
const { session, isLoading } = useSessionContext();
```

### ✅ Login Success Behavior
After a user logs in (e.g. via Supabase Google login):
- Retrieve the stored `postLoginRedirect` value
- Redirect to that path (default to `/` if none)
- Then remove it from `localStorage`

```ts
const redirectPath = localStorage.getItem("postLoginRedirect") || "/";
router.push(redirectPath);
localStorage.removeItem("postLoginRedirect");
```

### 💡 UX Tip
While `isLoading` is true, show a simple `<Spinner />` or return `null` to avoid flicker or premature redirect.

---

## 🔁 File Locations
- Update any shared auth guard or page-level checks inside `/web/app/profile-create/page.tsx` or a `withAuth` HOC if it exists
- If using `layout.tsx` wrappers for protection, apply the logic there

---

## 🔀 Git Workflow
- Apply this directly on `main` branch
- Commit message suggestion: `fix: improve login redirect handling for protected routes`

Once confirmed working, we will create a new branch for `/profile` viewer/editor.
