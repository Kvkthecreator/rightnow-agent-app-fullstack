# Testing Guide: ResearchAgentSDK Production API

This guide shows you how to test the ResearchAgentSDK in production.

---

## Quick Start

### Step 1: Generate JWT Token

I've created a simple script to generate Supabase-compatible JWT tokens for testing:

```bash
cd /Users/macbook/yarnnn-app-fullstack/work-platform/api

# Set required environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_JWT_SECRET="your-jwt-secret"

# Option 1: Run with user_id as argument
python3 generate_jwt_simple.py YOUR_USER_UUID

# Option 2: Let script prompt you for user_id
python3 generate_jwt_simple.py
```

**Where to find these values:**

1. **SUPABASE_URL**: Your Supabase project URL
   - Found in: Supabase Dashboard > Settings > API > Project URL
   - Format: `https://xxxxx.supabase.co`

2. **SUPABASE_JWT_SECRET**: Your JWT secret key
   - Found in: Supabase Dashboard > Settings > API > JWT Settings > JWT Secret
   - **IMPORTANT**: This is NOT the anon key or service role key

3. **YOUR_USER_UUID**: Your user ID in Supabase
   - Found in: Supabase Dashboard > Authentication > Users
   - Look for email `kvkthecreator@gmail.com`
   - Copy the UUID in the "ID" column
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 2: Find Your Basket ID

You need a basket_id to run research tasks. Find yours in:

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# List your baskets
SELECT id, name, workspace_id, created_at
FROM baskets
WHERE workspace_id IN (
  SELECT workspace_id FROM workspace_memberships
  WHERE user_id = 'YOUR_USER_UUID'
)
LIMIT 5;

# Copy a basket ID
```

Or use the Supabase Dashboard:
- Go to Table Editor > baskets
- Filter by your workspace
- Copy a basket `id`

### Step 3: Test the API

Once you have the JWT token (saved to `/tmp/yarnnn_test_jwt.txt`):

```bash
# Load token into environment
export TEST_JWT_TOKEN=$(cat /tmp/yarnnn_test_jwt.txt)

# Or use the generated env file
source /tmp/yarnnn_test_jwt_env.sh

# Test the API
curl -X POST https://yarnnn-work-platform-api.onrender.com/agents/run \
  -H "Authorization: Bearer $TEST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "research",
    "task_type": "deep_dive",
    "basket_id": "YOUR_BASKET_ID",
    "parameters": {
      "topic": "Test: AI agent SDK patterns and best practices"
    }
  }'
```

### Expected Response

**Success (200 OK):**
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
        "confidence": 0.85,
        "body": {...}
      }
    ],
    "work_session_id": "uuid",
    "outputs_written": 5
  },
  "work_request_id": "uuid",
  "is_trial_request": true,
  "remaining_trials": 9
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{"error": "invalid_token"}
```
- Token expired or invalid
- Regenerate token with `generate_jwt_simple.py`

**403 Forbidden:**
```json
{"detail": "Trial limit exceeded. Subscribe to continue."}
```
- You've used all 10 trial requests
- Create a subscription via `/agents/subscribe/research`

**404 Not Found:**
```json
{"detail": "Basket not found or access denied"}
```
- Basket doesn't exist or doesn't belong to your workspace
- Check basket_id is correct

---

## Validation Checklist

After running the API test, validate:

### ✅ 1. Agent Executed Successfully
- Response status: `"completed"`
- No errors in response

### ✅ 2. Work Outputs Created
- `result.outputs_written > 0`
- Check database:
  ```sql
  SELECT id, output_type, title, confidence, created_at
  FROM work_outputs
  WHERE work_session_id = 'YOUR_WORK_SESSION_ID'
  ORDER BY created_at DESC;
  ```

### ✅ 3. Skills Loaded
- Check Render logs for:
  ```
  INFO: Loaded 3 skills (26707 total chars)
  ```
- Confirms Skills are being injected into agent prompts

### ✅ 4. Work Session Tracked
- Check database:
  ```sql
  SELECT id, task_type, status, started_at, ended_at, metadata
  FROM work_sessions
  WHERE basket_id = 'YOUR_BASKET_ID'
  ORDER BY started_at DESC
  LIMIT 1;
  ```
- Status should be: `completed`
- Metadata should show: `{"output_count": N}`

### ✅ 5. Trial Request Counted
- Response shows: `"is_trial_request": true`
- Response shows: `"remaining_trials": 9` (or less)
- Check database:
  ```sql
  SELECT COUNT(*) as used_trials
  FROM work_requests
  WHERE user_id = 'YOUR_USER_ID'
    AND is_trial_request = true;
  ```

---

## Troubleshooting

### Issue: "Module 'jwt' not found"

Install PyJWT:
```bash
pip3 install pyjwt
```

### Issue: "SUPABASE_JWT_SECRET not set"

The script needs environment variables. Set them:
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_JWT_SECRET="your-secret-here"
```

Then run the script again.

### Issue: "Invalid user_id format"

User ID must be a UUID (36 characters with 4 dashes):
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Find it in: Supabase Dashboard > Authentication > Users

### Issue: Token expired

JWT tokens expire after 24 hours. Regenerate:
```bash
python3 generate_jwt_simple.py YOUR_USER_UUID
```

### Issue: "Basket not found"

Ensure:
1. Basket ID is correct (UUID format)
2. Basket belongs to your workspace
3. You have access to the workspace

Query your baskets:
```sql
SELECT b.id, b.name, w.name as workspace_name
FROM baskets b
JOIN workspaces w ON b.workspace_id = w.id
JOIN workspace_memberships wm ON w.id = wm.workspace_id
WHERE wm.user_id = 'YOUR_USER_UUID';
```

---

## Advanced Testing

### Test with Python

Create a test script:

```python
import requests
import os

token = os.getenv("TEST_JWT_TOKEN")
basket_id = os.getenv("TEST_BASKET_ID")

response = requests.post(
    "https://yarnnn-work-platform-api.onrender.com/agents/run",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "agent_type": "research",
        "task_type": "deep_dive",
        "basket_id": basket_id,
        "parameters": {
            "topic": "Test: Claude Agent SDK implementation patterns"
        }
    },
    timeout=180
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

### Check Render Logs

1. Go to: https://dashboard.render.com
2. Select: `yarnnn-work-platform-api`
3. Click: "Logs" tab
4. Look for:
   ```
   INFO: Agent orchestration initialized with ResearchAgentSDK
   INFO: Creating ResearchAgentSDK (basket=...)
   INFO: Loaded 3 skills (26707 total chars)
   INFO: Running deep dive research on: ...
   ```

---

## What to Look For

### Success Indicators:

✅ **Skills Loading:**
```
INFO: Loaded 3 skills (26707 total chars)
```
Confirms Phase 2b Skills extraction is working.

✅ **ResearchAgentSDK Usage:**
```
INFO: Creating ResearchAgentSDK (basket=...)
```
Confirms Phase 2a refactoring is in use (not legacy).

✅ **Work Outputs Created:**
```
INFO: Wrote 5 outputs successfully
```
Confirms agent generated structured deliverables.

✅ **Work Session Completed:**
```
INFO: Updated work session ... to status=completed, outputs=5
```
Confirms BFF pattern working correctly.

### Expected Performance:

- **Response Time**: 30-120 seconds (depending on research depth)
- **Outputs Created**: 3-10 findings/insights/recommendations
- **Confidence Scores**: 0.5-0.95 (based on evidence quality)
- **Trial Requests**: Decrements by 1 per execution

---

## Next Steps After Testing

1. **Validate Output Quality**
   - Review work outputs in database
   - Check confidence scores are calibrated correctly
   - Verify evidence citations are included

2. **Monitor Performance**
   - Check execution time
   - Monitor memory usage in Render
   - Validate no errors in logs

3. **Test Edge Cases**
   - Long topics (>500 chars)
   - Non-English topics
   - Topics requiring deep research

4. **Production Rollout**
   - Once validated, announce to team
   - Update frontend to show Skills-enhanced research
   - Monitor user feedback

---

## Files Created

- `generate_jwt_simple.py` - Simple JWT token generator
- `generate_test_jwt.py` - Advanced JWT generator (with DB lookup)
- `test_research_agent_production.py` - Automated test suite
- `TESTING_GUIDE.md` - This guide

---

**Ready to Test!** 🚀

Run `python3 generate_jwt_simple.py` to get started.
