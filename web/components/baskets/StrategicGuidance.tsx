"use client";

import { Target } from "lucide-react";

interface NextStep {
  description: string;
  priority: number;
}

interface StrategicGuidanceProps {
  nextSteps: NextStep[];
}

export function StrategicGuidance({ nextSteps }: StrategicGuidanceProps) {
  if (!nextSteps || nextSteps.length === 0) {
    return null;
  }

  // Sort by priority and take top 3
  const prioritizedSteps = nextSteps
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Focus on these next:</h3>
      </div>
      
      <ul className="space-y-3">
        {prioritizedSteps.map((step, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-primary">{index + 1}</span>
            </div>
            <span className="text-sm text-foreground">{step.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}