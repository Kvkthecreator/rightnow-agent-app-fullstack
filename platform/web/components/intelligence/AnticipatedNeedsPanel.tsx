"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface AnticipatedNeed {
  need_id: string;
  need_type: string;
  description: string;
  confidence: number;
  suggested_assistance: string;
}

interface SuggestedAction {
  action_id: string;
  action_type: string;
  description: string;
  priority: number;
  timing_suggestion: string;
}

interface FocusPrediction {
  prediction_id: string;
  predicted_focus: string;
  confidence: number;
  time_horizon: string;
}

interface Props {
  anticipatedNeeds: AnticipatedNeed[];
  suggestedActions: SuggestedAction[];
  focusPredictions: FocusPrediction[];
  isLoading: boolean;
}

export default function AnticipatedNeedsPanel({
  anticipatedNeeds,
  suggestedActions,
  focusPredictions,
  isLoading
}: Props) {
  const getNeedTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      inspiration: "💡",
      clarification: "❓",
      information: "📚",
      connection: "🔗",
      organization: "📋",
      validation: "✅",
      exploration: "🔍",
      default: "🤔"
    };
    return icons[type] || icons.default;
  };

  const getActionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      research: "🔍",
      organize: "📁",
      expand: "📝",
      connect: "🔗",
      review: "👀",
      create: "✨",
      default: "⚡"
    };
    return icons[type] || icons.default;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-green-600";
    if (confidence > 0.6) return "text-yellow-600";
    return "text-gray-500";
  };

  const getPriorityColor = (priority: number) => {
    if (priority > 0.8) return "border-red-200 bg-red-50";
    if (priority > 0.6) return "border-yellow-200 bg-yellow-50";
    return "border-gray-200 bg-gray-50";
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  const hasContent = anticipatedNeeds.length > 0 || suggestedActions.length > 0 || focusPredictions.length > 0;

  if (!hasContent) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">🔮</div>
        <h3 className="font-medium text-sm mb-2">Looking Ahead</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          As you work, I'll learn to anticipate your needs and suggest helpful actions at the right moments.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Anticipated Needs */}
      {anticipatedNeeds.length > 0 && (
        <section>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="text-base">🤔</span>
            Anticipated Needs
          </h3>
          <div className="space-y-3">
            {anticipatedNeeds.slice(0, 3).map((need) => (
              <Card key={need.need_id} className="p-3 border">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getNeedTypeIcon(need.need_type)}</span>
                      <div className="text-xs font-medium capitalize text-muted-foreground">
                        {need.need_type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className={cn("text-xs font-medium", getConfidenceColor(need.confidence))}>
                      {Math.round(need.confidence * 100)}%
                    </div>
                  </div>
                  
                  <p className="text-sm leading-relaxed">
                    {need.description}
                  </p>
                  
                  {need.suggested_assistance && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs text-blue-800 leading-relaxed">
                        💡 {need.suggested_assistance}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <section>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="text-base">⚡</span>
            Suggested Actions
          </h3>
          <div className="space-y-2">
            {suggestedActions
              .sort((a, b) => b.priority - a.priority)
              .slice(0, 4)
              .map((action) => (
                <Card 
                  key={action.action_id} 
                  className={cn("p-3 border", getPriorityColor(action.priority))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-sm">{getActionTypeIcon(action.action_type)}</span>
                      <div className="min-w-0">
                        <div className="text-sm leading-relaxed">
                          {action.description}
                        </div>
                        {action.timing_suggestion && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ⏱️ {action.timing_suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                    >
                      Try
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Focus Predictions */}
      {focusPredictions.length > 0 && (
        <section>
          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span className="text-base">🎯</span>
            Focus Predictions
          </h3>
          <div className="space-y-2">
            {focusPredictions
              .sort((a, b) => b.confidence - a.confidence)
              .slice(0, 3)
              .map((prediction) => (
                <Card key={prediction.prediction_id} className="p-3 border-dashed border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Next focus:</span> {prediction.predicted_focus}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {prediction.time_horizon}
                      </Badge>
                      <div className={cn("text-xs", getConfidenceColor(prediction.confidence))}>
                        {Math.round(prediction.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <div className="pt-2 border-t">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // Could trigger refresh of predictions
              console.log('Refresh predictions');
            }}
          >
            🔄 Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              // Could open help about how anticipation works
              console.log('Learn more');
            }}
          >
            ❓ How?
          </Button>
        </div>
      </div>
    </div>
  );
}