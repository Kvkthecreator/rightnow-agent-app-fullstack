"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ContextItem } from "@shared/contracts/context";

interface Props {
  position: { x: number; y: number };
  themes: string[];
  contextItems: ContextItem[];
  suggestedConnections: string[];
  onAction?: (action: string) => void;
  isVisible?: boolean;
}

export default function CursorContextTooltip({
  position,
  themes,
  contextItems,
  suggestedConnections,
  onAction,
  isVisible = true
}: Props) {
  if (!isVisible || (!themes.length && !contextItems.length && !suggestedConnections.length)) {
    return null;
  }

  const quickActions = [
    { label: "Analyze", icon: "🔍", action: "analyze" },
    { label: "Connect", icon: "🔗", action: "connect" },
    { label: "Enhance", icon: "✨", action: "enhance" }
  ];

  return (
    <div
      className="absolute z-30 pointer-events-auto"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(10px, -50%)'
      }}
    >
      <Card className="p-4 w-64 shadow-xl border bg-white/95 backdrop-blur">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">
              Context Here
            </h4>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          
          {themes.length > 0 && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-2">
                Active Themes
              </div>
              <div className="flex flex-wrap gap-1">
                {themes.slice(0, 3).map((theme, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {theme}
                  </Badge>
                ))}
                {themes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{themes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {contextItems.length > 0 && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-2">
                Relevant Context
              </div>
              <div className="space-y-1">
                {contextItems.slice(0, 2).map((item, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    <span className="font-medium capitalize">{item.type}:</span>{' '}
                    {item.summary || item.content?.substring(0, 50)}
                    {(item.content?.length || 0) > 50 && '...'}
                  </div>
                ))}
                {contextItems.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{contextItems.length - 2} more items
                  </div>
                )}
              </div>
            </div>
          )}
          
          {suggestedConnections.length > 0 && (
            <div>
              <div className="font-medium text-xs text-muted-foreground mb-2">
                Potential Connections
              </div>
              <div className="space-y-1">
                {suggestedConnections.slice(0, 2).map((connection, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    🔗 {connection}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-2 border-t">
            {quickActions.map((action) => (
              <Button
                key={action.action}
                variant="ghost"
                size="sm"
                onClick={() => onAction?.(action.action)}
                className="text-xs p-1 h-6"
              >
                <span className="mr-1">{action.icon}</span>
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}