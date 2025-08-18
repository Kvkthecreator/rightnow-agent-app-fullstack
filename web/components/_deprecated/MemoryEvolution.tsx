/** @deprecated Unused. Quarantined on 2025-08-18.
 *  DO NOT IMPORT. Scheduled for deletion after a short probation window.
 */

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

  const getConfidenceLabel = (score: number) => {
    if (score === 0) return "Ready to learn";
    if (score < 30) return "Early understanding";
    if (score < 60) return "Growing intelligence";
    if (score < 80) return "Strong insights";
    return "Deep understanding";
  };

  const getGrowthMessage = (growth: number, score: number) => {
    if (score === 0) return "Add content to start building intelligence";
    if (growth === 0) return "Intelligence is stable";
    if (growth < 5) return `Gradual intelligence growth (+${growth}%)`;
    if (growth < 15) return `Strong intelligence growth (+${growth}%)`;
    return `Rapid intelligence growth (+${growth}%)`;
  };

  const getProgressBarColor = (score: number) => {
    if (score === 0) return "bg-muted";
    if (score < 30) return "bg-yellow-500";
    if (score < 60) return "bg-blue-500";
    if (score < 80) return "bg-green-500";
    return "bg-emerald-500";
  };

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-3">
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
          <div className="text-sm font-medium">
            {getConfidenceLabel(confidenceScore)}: {confidenceScore}%
          </div>
          {memoryGrowth > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{memoryGrowth}%
            </Badge>
          )}
        </div>
      </div>
      
      <div className="mb-2 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(confidenceScore)}`}
          style={{ width: `${Math.max(confidenceScore, 2)}%` }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground">
        {getGrowthMessage(memoryGrowth, confidenceScore)}
      </p>
      
      {/* Additional insight for different confidence levels */}
      {confidenceScore === 0 && (
        <p className="text-xs text-blue-600 mt-1">
          Your first content will help me understand your project
        </p>
      )}
      
      {confidenceScore > 0 && confidenceScore < 30 && (
        <p className="text-xs text-yellow-600 mt-1">
          Building foundational understanding from your content
        </p>
      )}
      
      {confidenceScore >= 80 && (
        <p className="text-xs text-emerald-600 mt-1">
          Strong project intelligence • Ready for advanced synthesis
        </p>
      )}
    </div>
  );
}