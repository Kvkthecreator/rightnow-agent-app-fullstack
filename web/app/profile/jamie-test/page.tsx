"use client";

// web/app/profile/jamie-test/page.tsx
// This is a static-only preview page for the Creator Starter Kit report.
// Uses a hardcoded sample payload and can be replaced with live data logic later.
import React, { useState, useEffect } from 'react';

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
        // Extract structured report and optional markdown
        setReport(data.report || null);
        setMarkdown(data.report_markdown || null);
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
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold mb-4">Profile Analysis Summary</h1>
        {/* Readiness Rating */}
        <div>
          <h2 className="text-xl font-semibold">Readiness Rating</h2>
          <div className="ml-2">
            <strong>Score:</strong> {report.readiness_rating?.score ?? 'N/A'}
            <div className="text-gray-500 text-sm">
              {report.readiness_rating?.reason}
            </div>
          </div>
        </div>
        {/* Sections */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Sections</h2>
          <ul className="list-disc pl-4 space-y-2">
            {report.sections?.length > 0 ? (
              report.sections.map((section: any, idx: number) => (
                <li key={idx}>
                  <strong>{section.title}</strong>: {section.content}
                </li>
              ))
            ) : (
              <li>No sections available.</li>
            )}
          </ul>
        </div>
        {/* Next Steps */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
          <div>
            <strong>CTA:</strong> {report.cta ?? 'No CTA available.'}
          </div>
        </div>
        {/* Copy Markdown */}
        {markdown && (
          <div>
            <button
              className="mt-6 px-4 py-2 bg-gray-100 border rounded text-sm"
              onClick={() => {
                navigator.clipboard.writeText(markdown || '');
                alert('Markdown copied!');
              }}
            >
              Copy Markdown
            </button>
          </div>
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