# Quick Fix for "Processing..." Loop

## Immediate Action: Clear Browser Storage

The stuck messages are in corrupted localStorage. Have the user:

1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage → www.yarnnn.com
3. Find key starting with `tp-chat-`
4. Delete it
5. Refresh the page

This will clear the stuck messages and start fresh.

## Root Cause

The backend IS responding (200 OK in logs), but:
1. TP responses might be taking 15-30+ seconds (Claude SDK processing)
2. Frontend might have default fetch timeout
3. Browser might be canceling long requests

## Real Fix Needed

Add request timeout and loading states:

```typescript
// In ThinkingPartnerGateway.ts
async chat(message: string, timeoutMs: number = 60000): Promise<TPChatResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchWithToken('/api/tp/chat', {
      method: 'POST',
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // ... rest of code
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 60 seconds');
    }
    throw error;
  }
}
```

But this won't help if Claude is taking 30+ seconds to respond. The real issue is we need streaming or better progress indication.

## Alternative: Check if TP is actually working

The backend might be failing silently. Check Render logs for:
- `ERROR: TP chat failed: ...`
- Python stack traces
- Claude SDK errors

The 200 OK might be premature - maybe the response is being returned before Claude finishes.
