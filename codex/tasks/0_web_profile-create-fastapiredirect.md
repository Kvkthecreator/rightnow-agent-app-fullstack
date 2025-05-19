Task 2: Wire Up “Generate Report” Button to FastAPI Agent

Goal:
On Step 3, POST the aggregated form data to /agent endpoint of your FastAPI backend, using the Jamie-test agent flow.

On success:
Redirect user to /profile/${id} (your profiles live at /profile/[id]).

Codex Task
### Task: Integrate “Generate Report” with FastAPI Agent and Redirect

#### Goal
Update the file:
- `web/app/profile-create/page.tsx`

Modify the existing three-step wizard:

- On Step 3, clicking “Generate Report” should:
  1. Show a loading state (spinner or skeleton) while waiting.
  2. POST the full form data to the FastAPI `/agent` endpoint (use Jamie-test flow).
     - Use the base URL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/agent`
     - Use built-in fetch or an existing API helper.
  3. On success, extract the new profile’s `id` from the response and route to `/profile/${id}` (using Next.js `useRouter().push()`).
  4. If an error occurs, show the error inline and let the user retry.
  5. Form state must persist if an error occurs (don’t wipe state).

**Notes:**
- Only redirect on a valid `id` in a 2xx response.
- Do not submit again if already loading.
- Use async/await and try/catch for error handling.
- Do not submit incomplete form data (basic client validation).

**Optional:**  
- Add an environment fallback so it works locally and on Vercel.

File and Folder Paths for Your Repo

Page: web/app/profile-create/page.tsx
Components: web/components/profile-create/
API endpoint env: NEXT_PUBLIC_API_BASE_URL
Profiles route: /profile/[id]