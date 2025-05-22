## codex/tasks/2_task-3-reportsPATCH-secure_auth_dependency.md

# Secure current_user_id with Supabase JWT

## Changes
```diff
* api/src/app/util/auth_helpers.py

*** 🔧 Patch ***

@@
-from fastapi import HTTPException, Header
+from fastapi import HTTPException, Depends
+from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
+from supabase import create_client
+import os, jwt

-b # header stub...
+bearer = HTTPBearer()
+SUPA = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
+
+async def current_user_id(
+    creds: HTTPAuthorizationCredentials = Depends(bearer),
+) -> str:
+    token = creds.credentials
+    try:
+        payload = jwt.decode(token, options={"verify_signature": False})
+        user_id = payload["sub"]
+    except Exception:
+        raise HTTPException(status_code=401, detail="Invalid token")
+    return user_id


