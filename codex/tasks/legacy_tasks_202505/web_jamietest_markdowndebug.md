## codex/tasks/web_jamietest_markdowndebug.md

What I Want
Update the frontend page (e.g. web/app/profile/jamie-test/page.tsx) to robustly handle API responses from the /profile_analyzer endpoint.
Ensure the markdown rendering never passes a non-string to <ReactMarkdown>.
Add a debug log for the API response.
Always extract and render the correct Markdown string, even if the agent returns a nested object.
Handle cases where report_markdown is missing, not a string, or is nested.
Make sure the page displays an error or fallback gracefully.
Context / Relevant Files
Page: web/app/profile/jamie-test/page.tsx
Current code attempts:
setMarkdown(data.report_markdown || data.report || '');
But sometimes the API response is not a string, resulting in ReactMarkdown warnings.
Step-by-Step Instructions
Update the fetchData function to log and robustly extract the Markdown:
useEffect(() => {
  async function fetchData() {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();

      // Debug log the full API response
      console.log("API RESPONSE:", data);

      // Robustly extract a markdown string
      let markdownString = '';
      if (typeof data.report_markdown === "string") {
        markdownString = data.report_markdown;
      } else if (data.report_markdown && typeof data.report_markdown.text === "string") {
        markdownString = data.report_markdown.text;
      } else if (typeof data.report === "string") {
        markdownString = data.report;
      }
      setMarkdown(markdownString);

    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
Optional: Add a comment to explain this pattern above the code block.
Test with different possible backend API responses to confirm no more ReactMarkdown warnings.
If the markdown string is still blank, display a fallback message as you already do.
Acceptance Criteria
No more [react-markdown] Warning: please pass a string as 'children' warnings.
The markdown section always renders a string or an appropriate fallback.
Console shows the full API response for easy debugging.
Works regardless of agent response structure (string, object, or missing).