"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

interface Props {
  data: {
    keywords: string[];
  };
}

export function KeywordList({ data }: Props) {
  return (
    <Card className="bg-card text-card-foreground rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Keywords</h2>
      <div className="flex flex-wrap gap-2">
        {data.keywords.map((keyword, idx) => (
          <span key={idx} className="bg-muted px-2 py-1 rounded text-sm">
            {keyword}
          </span>
        ))}
      </div>
    </Card>
  );
}