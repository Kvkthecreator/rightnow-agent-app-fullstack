"use client";

// web/app/profile/jamie-test/page.tsx
// This is a static-only preview page for the Creator Starter Kit report.
// Uses a hardcoded sample payload and can be replaced with live data logic later.
import React, { useState, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown'; // no longer needed for structured rendering

// Base URL for backend API (set via NEXT_PUBLIC_API_BASE_URL in .env.local)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function JamieTestProfilePage() {
  // State for raw markdown (optional) and structured report
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sample input for the agent
  const input = {
    profile: {
      display_name: 'Jamie',
      sns_handle: '@jamiewellness',
      primary_sns_channel: 'Instagram',
      platforms: ['Instagram', 'YouTube Shorts'],
      follower_count: 820,
      niche: 'Wellness and Journaling',
      audience_goal: 'Young women seeking mindfulness and balance',
      monetization_goal: 'Brand sponsorships',
      primary_objective: 'Build a personal brand to help others',
      content_frequency: 'Weekly',
      tone_keywords: ['relatable', 'calm', 'inspiring'],
      favorite_brands: ['Headspace', 'Emma Chamberlain'],
      prior_attempts: 'Posted a few times but didn’t feel consistent',
      creative_barriers: 'I get stuck overthinking what people will think',
      locale: 'en-US'
    },
    user_id: 'jamie-test-user',
    task_id: 'jamie-test-task'
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Send request to backend using dynamic base URL
        const res = await fetch(`${API_BASE_URL}/profile_analyzer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        // Debug: log full API response
        console.log('API RESPONSE:', data);
        // Store full structured report
        setReport(data);
        // Robustly extract markdown string if provided
        let markdownString = '';
        if (typeof data.report_markdown === 'string') {
          markdownString = data.report_markdown;
        } else if (
          data.report_markdown &&
          typeof data.report_markdown.text === 'string'
        ) {
          markdownString = data.report_markdown.text;
        }
        setMarkdown(markdownString);
      } catch (err: any) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <p>Loading…</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-red-600">Error: {error}</p>
      </main>
    );
  }
  // Render structured report if available
  if (report) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Profile Analysis Summary</h1>
        <p>{report.summary}</p>

        <section>
          <h2 className="text-xl font-semibold">Readiness Rating</h2>
          <p><span className="font-bold">Score:</span> {report.readiness_rating?.score}</p>
          <p>{report.readiness_rating?.reason}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Sections</h2>
          <div className="space-y-4">
            {report.sections?.map((section: any, idx: number) => (
              <div key={idx} className="border rounded p-4">
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <p className="mb-2">{section.content}</p>
                {section.source_links?.length > 0 && (
                  <div>
                    <p className="font-semibold">Sources:</p>
                    <ul className="list-disc list-inside">
                      {section.source_links.map((link: string, i: number) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >{link}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Next Steps</h2>
          <p>{report.cta}</p>
        </section>

        {markdown && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(markdown);
              alert('Markdown copied to clipboard!');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Copy Markdown
          </button>
        )}
      </main>
    );
  }

  // Fallback when no report data available
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <p>No content available.</p>
    </main>
  );
}