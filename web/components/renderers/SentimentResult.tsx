"use client";
import React from "react";
import { Card } from "@/components/ui/Card";

interface Props {
  data: {
    label: string;
    score: number;
  };
}

export function SentimentResult({ data }: Props) {
  return (
    <Card className="bg-card text-card-foreground rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Sentiment Analysis</h2>
      <p className="text-base">
        Sentiment: <span className="font-medium">{data.label}</span>
      </p>
      <p className="text-base">
        Score: <span className="font-medium">{data.score}</span>
      </p>
    </Card>
  );
}