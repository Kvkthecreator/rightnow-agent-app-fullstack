"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface ProfileInsightReportProps {
  summary_markdown: string;
  strengths: string[];
  blindspots: string[];
  next_steps: string[];
}

export default function ProfileInsightReport({
  summary_markdown,
  strengths,
  blindspots,
  next_steps,
}: ProfileInsightReportProps) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Your Insight Report is ready</h2>
      <div className="prose mb-6">
        <ReactMarkdown>{summary_markdown}</ReactMarkdown>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Strengths</h3>
        <ul className="list-disc list-inside">
          {strengths.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Blindspots</h3>
        <ul className="list-disc list-inside">
          {blindspots.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Next Steps</h3>
        <ul className="list-disc list-inside">
          {next_steps.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}