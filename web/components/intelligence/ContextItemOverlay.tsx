"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@shared/contracts/context";

interface Props {
  contextItem: ContextItem & { relevance_score?: number; content?: string };
  position: { x: number; y: number };
  onDismiss?: () => void;
  onClick?: () => void;
}

const contextTypeStyles: Record<string, string> = {
  theme: "bg-blue-50 text-blue-700 border-blue-200",
  concept: "bg-green-50 text-green-700 border-green-200", 
  reference: "bg-purple-50 text-purple-700 border-purple-200",
  pattern: "bg-orange-50 text-orange-700 border-orange-200",
  connection: "bg-pink-50 text-pink-700 border-pink-200",
  default: "bg-gray-50 text-gray-700 border-gray-200"
};

const contextTypeIcons: Record<string, string> = {
  theme: "🎯",
  concept: "💡",
  reference: "📎",
  pattern: "🔗",
  connection: "🌐",
  default: "📌"
};

export default function ContextItemOverlay({
  contextItem,
  position,
  onDismiss,
  onClick
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const typeKey = contextItem.type ?? "default";
  const styleClass = contextTypeStyles[typeKey] || contextTypeStyles.default;
  const icon = contextTypeIcons[typeKey] || contextTypeIcons.default;
  
  const relevanceOpacity = Math.max(0.4, contextItem.relevance_score ?? 0);

  return (
    <div
      className="absolute z-10 pointer-events-auto"
      style={{ 
        left: position.x, 
        top: position.y,
        opacity: relevanceOpacity
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer transition-all duration-200 text-xs px-2 py-1",
          styleClass,
          isHovered && "scale-105 shadow-md"
        )}
        onClick={onClick}
      >
        <span className="mr-1">{icon}</span>
        {contextItem.type}
      </Badge>
      
      {isHovered && contextItem.content && (
        <Card className="absolute top-full left-0 mt-1 p-3 w-64 shadow-lg border bg-white z-20">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm capitalize">
                {contextItem.type} Context
              </h4>
              <div className="text-xs text-muted-foreground">
                {Math.round((contextItem.relevance_score ?? 0) * 100)}% relevant
              </div>
            </div>
            
            {contextItem.content && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {contextItem.content.substring(0, 150)}
                {contextItem.content.length > 150 && '...'}
              </p>
            )}
            
            <div className="flex justify-end pt-1">
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}