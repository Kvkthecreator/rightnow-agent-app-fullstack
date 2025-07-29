"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { BehavioralPattern } from "@/lib/intelligence/useBehavioralTriggers";

interface Props {
  isTyping: boolean;
  currentPattern: BehavioralPattern | null;
  responsiveMode: 'ambient' | 'active' | 'focused';
  className?: string;
}

export default function UserFocusIndicator({
  isTyping,
  currentPattern,
  responsiveMode,
  className
}: Props) {
  const getFocusState = () => {
    if (isTyping) {
      return {
        icon: "✍️",
        label: "Writing",
        description: "Actively creating",
        color: "bg-purple-100 text-purple-700 border-purple-200"
      };
    }

    if (responsiveMode === 'focused') {
      return {
        icon: "🎯",
        label: "Focused",
        description: "Deep work mode",
        color: "bg-blue-100 text-blue-700 border-blue-200"
      };
    }

    if (responsiveMode === 'active') {
      return {
        icon: "👁️",
        label: "Engaged",
        description: "Actively exploring",
        color: "bg-green-100 text-green-700 border-green-200"
      };
    }

    return {
      icon: "🌊",
      label: "Ambient",
      description: "Background awareness",
      color: "bg-gray-100 text-gray-600 border-gray-200"
    };
  };

  const getPatternInsight = () => {
    if (!currentPattern) return null;

    const insights = [];
    
    if (currentPattern.typing_rhythm === 'fast') {
      insights.push("Fast pace");
    } else if (currentPattern.typing_rhythm === 'slow') {
      insights.push("Thoughtful pace");
    }

    if (currentPattern.pause_frequency === 'frequent') {
      insights.push("Reflective");
    }

    if (currentPattern.selection_behavior === 'exploratory') {
      insights.push("Exploring");
    }

    return insights.length > 0 ? insights.join(" • ") : null;
  };

  const focusState = getFocusState();
  const patternInsight = getPatternInsight();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant="outline"
        className={cn("text-xs transition-all duration-200", focusState.color)}
        title={focusState.description}
      >
        <span className="mr-1">{focusState.icon}</span>
        {focusState.label}
      </Badge>
      
      {patternInsight && (
        <div className="text-xs text-muted-foreground" title="Writing pattern">
          {patternInsight}
        </div>
      )}
    </div>
  );
}