"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface Props {
  documentId: string;
  basketId: string;
  onAnalyze?: () => void;
  onConnect?: () => void;
  onEnhance?: () => void;
  onSummarize?: () => void;
  className?: string;
}

export default function FloatingIntelligenceActions({
  documentId,
  basketId,
  onAnalyze,
  onConnect,
  onEnhance,
  onSummarize,
  className
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const actions = [
    {
      label: "Analyze",
      icon: "🔍",
      description: "Deep analysis of document themes and patterns",
      onClick: onAnalyze,
      shortcut: "A"
    },
    {
      label: "Connect",
      icon: "🔗",
      description: "Find connections to other documents",
      onClick: onConnect,
      shortcut: "C"
    },
    {
      label: "Enhance",
      icon: "✨",
      description: "Suggest improvements and additions",
      onClick: onEnhance,
      shortcut: "E"
    },
    {
      label: "Summarize",
      icon: "📝",
      description: "Generate key insights summary",
      onClick: onSummarize,
      shortcut: "S"
    }
  ];

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-40 pointer-events-auto",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isExpanded && (
        <Card className="mb-4 p-2 shadow-lg border bg-white/95 backdrop-blur">
          <div className="space-y-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  action.onClick?.();
                  setIsExpanded(false);
                }}
                className="w-full justify-start text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{action.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                  <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {action.shortcut}
                  </kbd>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-200",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          isHovered && "scale-110",
          isExpanded && "rotate-45"
        )}
      >
        <span className="text-xl">
          {isExpanded ? "✕" : "🧠"}
        </span>
      </Button>
      
      {isHovered && !isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
            Intelligence Actions
          </div>
        </div>
      )}
    </div>
  );
}