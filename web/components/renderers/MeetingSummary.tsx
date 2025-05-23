"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

interface Props {
  data: {
    summary: string[];
  };
}

export function MeetingSummary({ data }: Props) {
  return (
    <Card className="bg-card text-card-foreground rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Meeting Summary</h2>
      <ul className="list-disc pl-5 space-y-2">
        {data.summary.map((point, idx) => (
          <li key={idx} className="text-base">
            {point}
          </li>
        ))}
      </ul>
    </Card>
  );
}