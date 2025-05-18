"use client";

// web/app/profile/jamie-test/page.tsx
// This is a static-only preview page for the Creator Starter Kit report.
// Uses a hardcoded sample payload and can be replaced with live data logic later.
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function JamieTestProfilePage() {
  const [markdown, setMarkdown] = useState<string | null>(null);
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
        const res = await fetch('/profile_analyzer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        setMarkdown(data.report_markdown || data.report || '');
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
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {markdown ? <ReactMarkdown>{markdown}</ReactMarkdown> : <p>No content available.</p>}
    </main>
  );
}