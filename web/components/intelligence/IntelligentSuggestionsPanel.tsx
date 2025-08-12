"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useSubstrate } from "@/lib/substrate/useSubstrate";
import { useState } from "react";
import { useWorkspaceId } from "@/hooks/useWorkspaceId";

interface IntelligentSuggestionsPanelProps {
  basketId: string;
  documentId?: string;
  focusMode: "document" | "basket";
}

export default function IntelligentSuggestionsPanel({ 
  basketId, 
  documentId, 
  focusMode 
}: IntelligentSuggestionsPanelProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Panel Header */}
      <div>
        <h3 className="font-medium text-sm">💡 Ideas for your next move</h3>
        <p className="text-xs text-muted-foreground">
          Gentle suggestions, your choice always
        </p>
      </div>

      {/* Coherence Suggestions */}
      <CoherenceSuggestionsCard basketId={basketId} />

      {/* Next Steps */}
      <NextStepsCard 
        basketId={basketId}
        documentId={documentId}
        focusMode={focusMode}
      />

      {/* Missing Context */}
      <MissingContextCard basketId={basketId} />

      {/* Connection Opportunities */}
      <ConnectionOpportunitiesCard basketId={basketId} />
    </div>
  );
}

function CoherenceSuggestionsCard({ basketId }: { basketId: string }) {
  const workspaceId = useWorkspaceId(basketId);
  const substrate = useSubstrate(basketId, workspaceId || 'default');
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  if (substrate.loading) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Spinner className="w-4 h-4" />
          <span className="text-xs font-medium text-muted-foreground">
            Loading suggestions...
          </span>
        </div>
      </Card>
    );
  }

  const suggestions: any[] = []; // TODO: use substrate data for suggestions
  const visibleSuggestions = suggestions.filter((s: any) => !dismissedSuggestions.has(s.suggestion_id));

  if (visibleSuggestions.length === 0) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Coherence Ideas
        </div>
        <div className="text-xs text-muted-foreground text-center py-2">
          {"Your basket is working fine as-is"}
        </div>
      </Card>
    );
  }

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  };

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Coherence Ideas
        </span>
        <Badge variant="outline" className="text-xs">
          {visibleSuggestions.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {visibleSuggestions.slice(0, 3).map((suggestion) => (
          <SuggestionCard
            key={suggestion.suggestion_id}
            suggestion={suggestion}
            onDismiss={() => handleDismiss(suggestion.suggestion_id)}
          />
        ))}
      </div>

      {/* TODO: Add accommodation note when substrate data is available */}
    </Card>
  );
}

interface SuggestionCardProps {
  suggestion: {
    suggestion_id: string;
    suggestion_type: string;
    priority: string;
    description: string;
    reasoning: string;
    suggested_action: string;
    expected_benefit: string;
    effort_estimate: string;
    user_choice_emphasis: string;
  };
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, onDismiss }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: "border-red-200 bg-red-50/50",
    medium: "border-yellow-200 bg-yellow-50/50", 
    low: "border-blue-200 bg-blue-50/50"
  };

  const priorityClass = priorityColors[suggestion.priority as keyof typeof priorityColors] || priorityColors.low;

  return (
    <div className={`border rounded-lg p-2 ${priorityClass}`}>
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium">{suggestion.description}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {suggestion.effort_estimate}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              <span className="font-medium">Why:</span> {suggestion.reasoning}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Action:</span> {suggestion.suggested_action}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Benefit:</span> {suggestion.expected_benefit}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground italic">
            {suggestion.user_choice_emphasis}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs h-auto p-1"
          >
            {expanded ? "Less" : "More"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NextStepsCard({ 
  basketId, 
  documentId, 
  focusMode 
}: { 
  basketId: string; 
  documentId?: string; 
  focusMode: "document" | "basket";
}) {
  // Mock next steps - would be generated by intelligent analysis
  const nextSteps = [
    {
      id: "1",
      action: "Add context for main theme",
      reasoning: "Would help clarify project direction",
      effort: "low",
      confidence: 0.8
    },
    {
      id: "2", 
      action: "Connect related documents",
      reasoning: "Similar patterns detected in other docs",
      effort: "medium",
      confidence: 0.6
    }
  ];

  return (
    <Card className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Suggested Next Steps
      </div>

      {nextSteps.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          Continue with your current approach
        </div>
      ) : (
        <div className="space-y-2">
          {nextSteps.map((step) => (
            <div key={step.id} className="border rounded p-2 bg-muted/20">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-medium">{step.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.reasoning}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {step.effort}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(step.confidence * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MissingContextCard({ basketId }: { basketId: string }) {
  // Mock missing context analysis - would be from intelligence
  const missingContext = [
    {
      type: "audience",
      description: "Who is this for?",
      impact: "medium"
    },
    {
      type: "constraint",
      description: "What are the limitations?", 
      impact: "low"
    }
  ];

  const impactColors = {
    high: "text-red-600",
    medium: "text-yellow-600",
    low: "text-blue-600"
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">
        Missing Context (Optional)
      </div>

      {missingContext.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          Context looks complete
        </div>
      ) : (
        <div className="space-y-1">
          {missingContext.map((context, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <Badge variant="outline" className="text-xs mr-2">
                  {context.type}
                </Badge>
                <span className="text-xs">{context.description}</span>
              </div>
              <span className={`text-xs ${impactColors[context.impact as keyof typeof impactColors]}`}>
                {context.impact}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
        💡 These are just ideas - your current approach works fine too
      </div>
    </Card>
  );
}

function ConnectionOpportunitiesCard({ basketId }: { basketId: string }) {
  const workspaceId = useWorkspaceId(basketId);
  const substrate = useSubstrate(basketId, workspaceId || 'default');

  if (substrate.loading) {
    return (
      <Card className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Connection Opportunities
        </div>
        <div className="space-y-1">
          {[1, 2].map(i => (
            <div key={i} className="h-3 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    );
  }

  const connections: any[] = []; // TODO: use substrate data for connections

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Connection Opportunities
        </span>
        <Badge variant="outline" className="text-xs">
          {connections.length}
        </Badge>
      </div>

      {connections.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-2">
          No connections suggested
        </div>
      ) : (
        <div className="space-y-1">
          {connections.slice(0, 2).map((connection, index) => (
            <div key={index} className="text-xs p-2 bg-muted/30 rounded border-l-2 border-blue-200">
              <p className="font-medium">{connection}</p>
            </div>
          ))}
          {connections.length > 2 && (
            <Button variant="ghost" size="sm" className="w-full text-xs">
              +{connections.length - 2} more opportunities
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}