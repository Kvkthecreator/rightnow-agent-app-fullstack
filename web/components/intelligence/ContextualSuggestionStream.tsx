"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { SmartSuggestion } from "@/lib/intelligence/useSmartSuggestionTiming";

interface Props {
  suggestions: SmartSuggestion[];
  onDismiss: (suggestionId: string) => void;
  isWaitingForTiming?: boolean;
  maxVisible?: number;
}

export default function ContextualSuggestionStream({
  suggestions,
  onDismiss,
  isWaitingForTiming = false,
  maxVisible = 2
}: Props) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<SmartSuggestion[]>([]);
  const [animatingOut, setAnimatingOut] = useState<Set<string>>(new Set());

  // Update visible suggestions with smooth transitions
  useEffect(() => {
    const topSuggestions = suggestions
      .slice(0, maxVisible)
      .filter(s => !animatingOut.has(s.id));

    setVisibleSuggestions(topSuggestions);
  }, [suggestions, maxVisible, animatingOut]);

  const handleDismiss = (suggestionId: string) => {
    // Animate out first
    setAnimatingOut(prev => new Set([...prev, suggestionId]));
    
    // Remove after animation
    setTimeout(() => {
      onDismiss(suggestionId);
      setAnimatingOut(prev => {
        const updated = new Set([...prev]);
        updated.delete(suggestionId);
        return updated;
      });
    }, 300);
  };

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    const icons = {
      contextual: "🎯",
      behavioral: "🧠",
      memory: "🧩",
      insight: "💡"
    };
    return icons[type] || "💭";
  };

  const getPriorityColor = (priority: number) => {
    if (priority > 0.8) return "border-green-200 bg-green-50";
    if (priority > 0.6) return "border-blue-200 bg-blue-50";
    return "border-gray-200 bg-gray-50";
  };

  const getTimingBadge = (suggestion: SmartSuggestion) => {
    if (suggestion.timing.immediate) {
      return (
        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
          Now
        </Badge>
      );
    }
    
    if (suggestion.timing.delay < 2000) {
      return (
        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
          Soon
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
        Later
      </Badge>
    );
  };

  if (visibleSuggestions.length === 0 && !isWaitingForTiming) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {isWaitingForTiming && visibleSuggestions.length === 0 && (
        <Card className="p-3 border-dashed border-gray-300 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span>Waiting for optimal timing...</span>
          </div>
        </Card>
      )}

      {visibleSuggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          className={cn(
            "p-3 transition-all duration-300 border",
            getPriorityColor(suggestion.priority),
            animatingOut.has(suggestion.id) && "opacity-0 scale-95 translate-x-2"
          )}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{getSuggestionIcon(suggestion.type)}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium capitalize text-muted-foreground">
                    {suggestion.type} Suggestion
                  </div>
                  <div className="text-sm leading-relaxed">
                    {suggestion.content}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(suggestion.id)}
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              >
                ×
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTimingBadge(suggestion)}
                <div className="text-xs text-muted-foreground">
                  {Math.round(suggestion.confidence * 100)}% confident
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <div 
                  className="h-1 w-8 bg-gray-200 rounded-full overflow-hidden"
                  title={`Priority: ${Math.round(suggestion.priority * 100)}%`}
                >
                  <div 
                    className={cn(
                      "h-full transition-all duration-300",
                      suggestion.priority > 0.8 ? "bg-green-500" :
                      suggestion.priority > 0.6 ? "bg-blue-500" : "bg-gray-400"
                    )}
                    style={{ width: `${suggestion.priority * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {suggestion.trigger_source && (
              <div className="text-xs text-muted-foreground opacity-75">
                Triggered by: {suggestion.trigger_source.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        </Card>
      ))}

      {suggestions.length > maxVisible && (
        <div className="text-xs text-muted-foreground text-center py-1">
          +{suggestions.length - maxVisible} more suggestions waiting
        </div>
      )}
    </div>
  );
}