// web/app/profile/jamie-test/page.tsx
// This is a static-only preview page for the Creator Starter Kit report.
// Uses a hardcoded sample payload and can be replaced with live data logic later.
import React from 'react';

const jamieProfileOutput = {
  type: "structured",
  output_type: "creator_starter_kit",
  report: {
    suggested_niches: ["Wellness journaling", "Mindful productivity"],
    audience_persona: "Young women (ages 18–25) seeking balance in a busy world",
    content_strengths: ["relatable", "calm", "first-person reflections"],
    platform_fit: ["Instagram", "YouTube Shorts"],
    starting_content_ideas: [
      "How I journal when I'm anxious",
      "3 quiet habits that changed my day",
      "What I’d tell my younger self about burnout"
    ],
    growth_readiness_note:
      "You're deeply thoughtful and aligned with a powerful niche. Just start—your tone is your strength."
  }
};

export default function JamieTestProfilePage() {
  const {
    suggested_niches,
    audience_persona,
    content_strengths,
    platform_fit,
    starting_content_ideas,
    growth_readiness_note
  } = jamieProfileOutput.report;

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* TODO: Replace hardcoded payload with live fetch logic */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold">Your Suggested Niches</h2>
        <ul className="list-disc list-inside space-y-1">
          {suggested_niches.map((niche) => (
            <li key={niche}>{niche}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-2xl font-bold">Your Audience Persona</h2>
        <p>{audience_persona}</p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-2xl font-bold">Your Content Strengths</h2>
        <ul className="list-disc list-inside space-y-1">
          {content_strengths.map((strength) => (
            <li key={strength}>{strength}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-2xl font-bold">Your Best Platforms to Start On</h2>
        <ul className="list-disc list-inside space-y-1">
          {platform_fit.map((platform) => (
            <li key={platform}>{platform}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-2xl font-bold">Starter Content Ideas</h2>
        <ul className="list-disc list-inside space-y-1">
          {starting_content_ideas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-2xl font-bold">Growth Readiness Note</h2>
        <p>{growth_readiness_note}</p>
      </section>

      <div className="mt-8 flex space-x-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded">Export</button>
      </div>
    </main>
  );
}