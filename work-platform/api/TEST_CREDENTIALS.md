# Test Credentials & API Testing

## Your Credentials

### User Information
- **User ID**: `aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2` ⚠️ NOTE: NOT `21f4` but `2114`
- **Email**: `kvkthecreator@gmail.com`
- **Workspace ID**: `99e6bf7d-513c-45ff-9b96-9362bd914d12`

### Basket
- **Basket ID**: `5004b9e1-67f5-4955-b028-389d45b1f5a4`
- **Basket Name**: `ani-project`

### Supabase
- **URL**: `https://galytxxkrbksilekmhcw.supabase.co`
- **JWT Secret**: `2w83nFABokYp0g18I1Lp9u91TQUEFfhvT0EYqHs/0Hg47qGbB6bXw+U0JHdJUSE0QIwxOpZ+cZjAC/ai6/3cFw==`

---

## JWT Token (Valid for 24 hours)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzNTY3MzYzLCJpYXQiOjE3NjM0ODA5NjMsImlzcyI6Imh0dHBzOi8vZ2FseXR4eGtyYmtzaWxla21oY3cuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6ImFhOTRmYmQ5LTEzY2MtNGRiYy1hOWZiLTIxMTRhZDA5MjhmMiIsImVtYWlsIjoia3ZrdGhlY3JlYXRvckBnbWFpbC5jb20iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJ0ZXN0LXNlc3Npb24tYWE5NGZiZDkifQ.w6o4jX-jSTHvEKT6U4veZfPfszUVqX9fnDXFz2VPOCw
```

**Expires**: 2025-11-20T00:49:23Z
**User ID**: `aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2` (CORRECT)

---

## Test API Command

### ⚠️ Important: Render Configuration Required

**CRITICAL**: The `SUPABASE_JWT_SECRET` environment variable MUST be set in Render.

**Steps to Configure:**
1. Go to Render dashboard: https://dashboard.render.com
2. Select service: `yarnnn-work-platform-api` (or `yarnnn-app-fullstack`)
3. Go to "Environment" tab
4. Add environment variable:
   - Key: `SUPABASE_JWT_SECRET`
   - Value: `2w83nFABokYp0g18I1Lp9u91TQUEFfhvT0EYqHs/0Hg47qGbB6bXw+U0JHdJUSE0QIwxOpZ+cZjAC/ai6/3cFw==`
5. Click "Save Changes" - service will auto-redeploy

**Why This Matters:**
- Without this secret, all JWT tokens fail with 401 (invalid_token)
- The secret is used to verify JWT signatures
- Updated in render.yaml but must also be set manually in Render dashboard

### Once Service is Live

```bash
# Set environment variable (CORRECTED USER ID)
export TEST_JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzNTY3MzYzLCJpYXQiOjE3NjM0ODA5NjMsImlzcyI6Imh0dHBzOi8vZ2FseXR4eGtyYmtzaWxla21oY3cuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6ImFhOTRmYmQ5LTEzY2MtNGRiYy1hOWZiLTIxMTRhZDA5MjhmMiIsImVtYWlsIjoia3ZrdGhlY3JlYXRvckBnbWFpbC5jb20iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInNlc3Npb25faWQiOiJ0ZXN0LXNlc3Npb24tYWE5NGZiZDkifQ.w6o4jX-jSTHvEKT6U4veZfPfszUVqX9fnDXFz2VPOCw"

# Test ResearchAgentSDK
curl -X POST https://yarnnn-app-fullstack.onrender.com/api/agents/run \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "research",
    "task_type": "deep_dive",
    "basket_id": "5004b9e1-67f5-4955-b028-389d45b1f5a4",
    "parameters": {
      "topic": "Test: ResearchAgentSDK with Skills - Phase 2 validation"
    }
  }' | jq .
```

---

## Expected Response

### Success (200 OK)

```json
{
  "status": "completed",
  "agent_type": "research",
  "task_type": "deep_dive",
  "message": "research task completed successfully with N outputs for review",
  "result": {
    "work_outputs": [
      {
        "output_type": "finding",
        "title": "...",
        "body": {...},
        "confidence": 0.85
      }
    ],
    "work_session_id": "...",
    "outputs_written": 5
  },
  "work_request_id": "...",
  "is_trial_request": true,
  "remaining_trials": 9
}
```

### What to Validate

After successful test:

1. **✅ Agent Executed**: Response status = "completed"
2. **✅ Work Outputs Created**: `outputs_written > 0`
3. **✅ Skills Loaded**: Check Render logs for "Loaded 3 skills (26707 total chars)"
4. **✅ ResearchAgentSDK Used**: Logs show "Creating ResearchAgentSDK"
5. **✅ Trial Counted**: `is_trial_request: true`, `remaining_trials: 9`

---

## Regenerate JWT Token (when expired)

```bash
cd /Users/macbook/yarnnn-app-fullstack/work-platform/api

export SUPABASE_URL="https://galytxxkrbksilekmhcw.supabase.co"
export SUPABASE_JWT_SECRET="2w83nFABokYp0g18I1Lp9u91TQUEF+hvTOEYqHs/OHg47qGbB6bXw+U0JHdJUSE0QfwxOpZ+cZjAC/a16/3cFw=="

# IMPORTANT: Use CORRECT user ID (2114ad NOT 21f4ad)
python3 generate_jwt_simple.py aa94fbd9-13cc-4dbc-a9fb-2114ad0928f2
```

---

## Check Deployment Status

### Render Dashboard
1. Go to: https://dashboard.render.com
2. Find service: `yarnnn-work-platform-api`
3. Check status: Should be "Live" (green)
4. If not, click "Manual Deploy" > "Deploy latest commit"

### Check Logs
In Render dashboard:
- Click on `yarnnn-work-platform-api`
- Go to "Logs" tab
- Look for:
  ```
  INFO: Agent orchestration initialized with ResearchAgentSDK
  INFO: Loaded 3 skills (26707 total chars)
  ```

---

## Database Queries

### Check Work Outputs (after test)

```sql
-- Connect to database
psql "postgresql://postgres.galytxxkrbksilekmhcw:4ogIUdwWzVyPH0nU@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

-- View recent work outputs
SELECT
  id,
  output_type,
  title,
  confidence,
  created_at
FROM work_outputs
WHERE basket_id = '5004b9e1-67f5-4955-b028-389d45b1f5a4'
ORDER BY created_at DESC
LIMIT 10;

-- View work sessions
SELECT
  id,
  task_type,
  status,
  started_at,
  ended_at,
  metadata
FROM work_sessions
WHERE basket_id = '5004b9e1-67f5-4955-b028-389d45b1f5a4'
ORDER BY started_at DESC
LIMIT 5;

-- Check trial usage
SELECT
  COUNT(*) as used_trials
FROM work_requests
WHERE user_id = 'aa94fbd9-13cc-4dbc-a9fb-21f4ad0928f2'
  AND is_trial_request = true;
```

---

## Summary

✅ **Credentials Ready**: All credentials extracted and JWT generated
✅ **Test Command Ready**: curl command prepared with your basket_id
⏳ **Render Service**: Needs to be live (check dashboard)
⏳ **Testing**: Run test once service is up

**Next Action**: Check Render dashboard to ensure `yarnnn-work-platform-api` service is running, then run the test command above.
