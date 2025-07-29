"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BlockSuggestion {
  suggestion_id: string;
  block_type: string;
  suggested_content: string;
  confidence: number;
  reasoning: string;
  position: number;
}

interface Props {
  suggestion: BlockSuggestion;
  position: { x: number; y: number };
  onAccept?: (suggestion: BlockSuggestion) => void;
  onDismiss?: () => void;
  isVisible?: boolean;
}

const blockTypeStyles: Record<string, { color: string; icon: string; label: string }> = {
  insight: { color: "text-blue-700 bg-blue-50 border-blue-200", icon: "💡", label: "Insight" },
  question: { color: "text-purple-700 bg-purple-50 border-purple-200", icon: "❓", label: "Question" },
  action: { color: "text-green-700 bg-green-50 border-green-200", icon: "⚡", label: "Action" },
  reference: { color: "text-orange-700 bg-orange-50 border-orange-200", icon: "📎", label: "Reference" },
  conclusion: { color: "text-red-700 bg-red-50 border-red-200", icon: "🎯", label: "Conclusion" },
  default: { color: "text-gray-700 bg-gray-50 border-gray-200", icon: "📝", label: "Block" }
};

export default function BlockSuggestionPopover({
  suggestion,
  position,
  onAccept,
  onDismiss,
  isVisible = true
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!isVisible) return null;
  
  const blockStyle = blockTypeStyles[suggestion.block_type] || blockTypeStyles.default;
  const confidenceColor = suggestion.confidence > 0.8 ? "text-green-600" : 
                         suggestion.confidence > 0.6 ? "text-yellow-600" : "text-red-600";

  return (
    <div
      className="absolute z-20 pointer-events-auto"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translateY(-100%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={cn(
        "p-4 w-80 shadow-lg border-2 bg-white transition-all duration-200",
        blockStyle.color,
        isHovered && "scale-105"
      )}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{blockStyle.icon}</span>
              <h4 className="font-medium text-sm">
                Suggested {blockStyle.label}
              </h4>
            </div>
            <div className={cn("text-xs font-medium", confidenceColor)}>
              {Math.round(suggestion.confidence * 100)}%
            </div>
          </div>
          
          <div className="bg-white/50 rounded p-3 border">
            <p className="text-sm leading-relaxed">
              {suggestion.suggested_content}
            </p>
          </div>
          
          {suggestion.reasoning && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Why this suggestion?
              </summary>
              <p className="mt-2 leading-relaxed">
                {suggestion.reasoning}
              </p>
            </details>
          )}
          
          <div className="flex justify-between items-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-xs"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              onClick={() => onAccept?.(suggestion)}
              className="text-xs"
            >
              Add Block
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}