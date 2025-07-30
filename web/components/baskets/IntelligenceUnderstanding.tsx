"use client";

import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface IntelligenceUnderstandingProps {
  understanding: string;
  themes: string[];
}

export function IntelligenceUnderstanding({ understanding, themes }: IntelligenceUnderstandingProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Your Project Intelligence</h2>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-lg text-muted-foreground leading-relaxed">
          {understanding}
        </p>
      </div>
      
      {themes && themes.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {themes.map((theme, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {theme}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}