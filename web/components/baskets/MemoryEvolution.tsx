"use client";

import { GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface MemoryEvolutionProps {
  confidenceScore: number;
  memoryGrowth: number;
  lastUpdated?: string;
}

export function MemoryEvolution({ confidenceScore, memoryGrowth, lastUpdated }: MemoryEvolutionProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Project Memory</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              • Updated {formatDate(lastUpdated)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Intelligence: {confidenceScore}%</div>
          {memoryGrowth > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{memoryGrowth}% this week
            </Badge>
          )}
        </div>
      </div>
      
      <div className="mt-2 h-2 bg-muted rounded-full">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min(confidenceScore, 100)}%` }}
        />
      </div>
      
      {confidenceScore < 30 && (
        <p className="text-xs text-muted-foreground mt-2">
          Add more content to build stronger project intelligence
        </p>
      )}
      
      {confidenceScore >= 70 && (
        <p className="text-xs text-primary mt-2">
          Your knowledge graph is getting smarter • Strong project understanding
        </p>
      )}
    </div>
  );
}