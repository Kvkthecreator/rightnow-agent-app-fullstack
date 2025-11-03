"use client";

import { Brain, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressiveDisclosure } from "@/components/narrative/ProgressiveDisclosure";
import { 
  transformConfidenceToNarrative, 
  transformHealthToNarrative,
  createProgressiveStory 
} from "@/lib/narrative/utils/languageTransformation";

interface UnderstandingProgressProps {
  confidenceScore: number;
  memoryGrowth: number;
  lastUpdated?: string;
  stage?: string;
  themes?: number;
  insights?: number;
  health?: string;
}

export function UnderstandingProgress({ 
  confidenceScore, 
  memoryGrowth, 
  lastUpdated,
  stage,
  themes = 0,
  insights = 0,
  health
}: UnderstandingProgressProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Transform confidence score to narrative
  const confidenceNarrative = transformConfidenceToNarrative(confidenceScore / 100);
  const healthNarrative = health ? transformHealthToNarrative(health) : null;

  const getGrowthMessage = (growth: number, score: number): string => {
    if (score === 0) return "Ready to start understanding your project";
    if (growth === 0) return "Understanding is stable and ready for your next addition";
    if (growth < 5) return `Steady progress in understanding your work (+${growth}%)`;
    if (growth < 15) return `Strong growth in project understanding (+${growth}%)`;
    return `Rapid expansion of understanding (+${growth}%)`;
  };

  const getProgressBarColor = (score: number): string => {
    if (score === 0) return "bg-gray-300";
    if (score < 30) return "bg-orange-400";
    if (score < 60) return "bg-blue-500";
    if (score < 80) return "bg-green-500";
    return "bg-emerald-500";
  };

  const getStageIcon = (score: number) => {
    if (score === 0) return <Clock className="h-4 w-4" />;
    if (score < 60) return <Brain className="h-4 w-4" />;
    if (score < 80) return <TrendingUp className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  const progressiveStory = createProgressiveStory(
    `I ${confidenceNarrative.level.toLowerCase()} with ${themes} ${themes === 1 ? 'theme' : 'themes'} and ${insights} ${insights === 1 ? 'insight' : 'insights'} in your project.`,
    `${confidenceNarrative.description} The understanding level is based on content analysis, pattern recognition, and thematic development. Recent growth of ${memoryGrowth}% indicates active learning and development.`,
    {
      confidenceScore,
      memoryGrowth,
      stage,
      themes,
      insights,
      lastUpdated,
      analysisMetrics: {
        contentVolume: insights,
        thematicDevelopment: themes,
        understandingStrength: confidenceNarrative.strength
      }
    }
  );

  return (
    <div className="understanding-progress border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${confidenceNarrative.color}-100`}>
            <div className={`text-${confidenceNarrative.color}-600`}>
              {getStageIcon(confidenceScore)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {confidenceNarrative.level}
            </div>
            <div className="text-xs text-gray-500">
              Project Understanding
              {lastUpdated && (
                <span> • Updated {formatDate(lastUpdated)}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {healthNarrative && (
            <Badge variant="outline" className={`text-${healthNarrative.color}-700 border-${healthNarrative.color}-200 text-xs`}>
              {healthNarrative.level}
            </Badge>
          )}
          {memoryGrowth > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{memoryGrowth}%
            </Badge>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${getProgressBarColor(confidenceScore)}`}
          style={{ width: `${Math.max(confidenceScore, 3)}%` }}
        />
      </div>
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{themes}</div>
          <div className="text-xs text-gray-600">{themes === 1 ? 'Theme' : 'Themes'}</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{insights}</div>
          <div className="text-xs text-gray-600">{insights === 1 ? 'Insight' : 'Insights'}</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{confidenceScore}%</div>
          <div className="text-xs text-gray-600">Understanding</div>
        </div>
      </div>

      {/* Progressive Disclosure */}
      <ProgressiveDisclosure
        story={progressiveStory.story}
        reasoning={progressiveStory.reasoning}
        substrate={progressiveStory.substrate}
        className="bg-gray-50 rounded-lg p-3"
      />
      
      {/* Growth Message */}
      <div className="mt-3">
        <p className="text-xs text-gray-600">
          {getGrowthMessage(memoryGrowth, confidenceScore)}
        </p>
        
        {/* Stage-specific encouragement */}
        {confidenceScore === 0 && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Share your first thoughts to begin our collaboration
          </p>
        )}
        
        {confidenceScore > 0 && confidenceScore < 30 && (
          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Building foundational understanding from your content
          </p>
        )}
        
        {confidenceScore >= 30 && confidenceScore < 60 && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Developing strong insights about your project
          </p>
        )}
        
        {confidenceScore >= 60 && confidenceScore < 80 && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Rich understanding enables strategic guidance
          </p>
        )}
        
        {confidenceScore >= 80 && (
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Deep understanding • Ready for advanced strategic planning
          </p>
        )}
      </div>
    </div>
  );
}