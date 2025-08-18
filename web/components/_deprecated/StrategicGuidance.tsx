/** @deprecated Unused. Quarantined on 2025-08-18.
 *  DO NOT IMPORT. Scheduled for deletion after a short probation window.
 */

"use client";

import { Target, ArrowRight, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressiveDisclosure } from "../narrative/ProgressiveDisclosure";
import { 
  transformTimeframe, 
  transformDifficulty,
  createProgressiveStory 
} from "@/lib/narrative/utils/languageTransformation";

interface NextStep {
  description: string;
  priority: number;
}

interface StrategicGuidanceItem {
  title: string;
  description: string;
  recommendation: string;
  reasoning: string;
  action_plan: Array<{
    step: string;
    description: string;
    user_benefit: string;
    estimated_time: string;
    prerequisite?: string;
  }>;
  expected_outcome: string;
  timeframe: string;
  difficulty: string;
}

interface StrategicGuidanceProps {
  nextSteps?: NextStep[];
  guidance?: StrategicGuidanceItem[];
}

export function StrategicGuidance({ nextSteps, guidance }: StrategicGuidanceProps) {
  // Show guidance if available, otherwise fall back to nextSteps
  if (guidance && guidance.length > 0) {
    return (
      <div className="strategic-guidance mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Strategic Guidance</h3>
        </div>
        
        <div className="space-y-4">
          {guidance.map((item, index) => (
            <GuidanceCard key={index} guidance={item} />
          ))}
        </div>
      </div>
    );
  }

  if (!nextSteps || nextSteps.length === 0) {
    return null;
  }

  // Sort by priority and take top 3
  const prioritizedSteps = nextSteps
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return (
    <div className="strategic-guidance mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">Focus on these next:</h3>
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

interface GuidanceCardProps {
  guidance: StrategicGuidanceItem;
}

function GuidanceCard({ guidance }: GuidanceCardProps) {
  const difficultyInfo = transformDifficulty(guidance.difficulty);
  const timeframeText = transformTimeframe(guidance.timeframe);
  
  const progressiveStory = createProgressiveStory(
    guidance.recommendation,
    guidance.reasoning,
    {
      actionPlan: guidance.action_plan,
      expectedOutcome: guidance.expected_outcome,
      timeframe: guidance.timeframe,
      difficulty: guidance.difficulty
    }
  );

  return (
    <div className="guidance-card border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{guidance.title}</h4>
          <p className="text-sm text-gray-600">{guidance.description}</p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <Badge 
            variant="outline" 
            className={`text-${difficultyInfo.color}-700 border-${difficultyInfo.color}-200 text-xs`}
          >
            {difficultyInfo.label}
          </Badge>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeframeText}
          </div>
        </div>
      </div>

      <ProgressiveDisclosure
        story={progressiveStory.story}
        reasoning={progressiveStory.reasoning}
        substrate={progressiveStory.substrate}
        className="mb-4"
      />

      {/* Action Plan Preview */}
      {guidance.action_plan && guidance.action_plan.length > 0 && (
        <div className="action-preview">
          <div className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Next steps:
          </div>
          <div className="space-y-2">
            {guidance.action_plan.slice(0, 2).map((step, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{step.step}</div>
                  <div className="text-gray-600 text-xs">{step.user_benefit}</div>
                  {step.estimated_time && (
                    <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {step.estimated_time}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {guidance.action_plan.length > 2 && (
              <div className="text-xs text-gray-500 ml-7">
                +{guidance.action_plan.length - 2} more steps
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expected Outcome */}
      {guidance.expected_outcome && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-300">
          <div className="text-sm font-medium text-green-900 mb-1">Expected outcome:</div>
          <div className="text-sm text-green-800">{guidance.expected_outcome}</div>
        </div>
      )}
    </div>
  );
}