"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface MemoryConnection {
  connection_id: string;
  related_document_id: string;
  related_content: string;
  connection_type: "thematic" | "factual" | "contextual" | "reference";
  strength: number;
  position?: {
    start: number;
    end: number;
  };
}

interface Props {
  connection: MemoryConnection;
  children: React.ReactNode;
  onNavigate?: (documentId: string) => void;
  onDismiss?: () => void;
}

const connectionTypeStyles: Record<string, { 
  borderColor: string; 
  backgroundColor: string; 
  icon: string; 
  label: string;
}> = {
  thematic: { 
    borderColor: "border-blue-300", 
    backgroundColor: "bg-blue-50/30", 
    icon: "🎯", 
    label: "Theme" 
  },
  factual: { 
    borderColor: "border-green-300", 
    backgroundColor: "bg-green-50/30", 
    icon: "📊", 
    label: "Fact" 
  },
  contextual: { 
    borderColor: "border-purple-300", 
    backgroundColor: "bg-purple-50/30", 
    icon: "🌐", 
    label: "Context" 
  },
  reference: { 
    borderColor: "border-orange-300", 
    backgroundColor: "bg-orange-50/30", 
    icon: "📎", 
    label: "Reference" 
  }
};

export default function MemoryConnectionHighlight({
  connection,
  children,
  onNavigate,
  onDismiss
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  
  const style = connectionTypeStyles[connection.connection_type];
  const strengthOpacity = Math.max(0.3, connection.strength);

  return (
    <span
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        "border-b-2 border-dotted",
        style.borderColor,
        style.backgroundColor,
        isHovered && "scale-105"
      )}
      style={{ opacity: strengthOpacity }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {isHovered && (
        <Card className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-4 w-72 shadow-xl border-2 bg-white z-30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{style.icon}</span>
                <h4 className="font-medium text-sm">
                  {style.label} Connection
                </h4>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(connection.strength * 100)}% match
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-3 border">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {connection.related_content.substring(0, 200)}
                {connection.related_content.length > 200 && '...'}
              </p>
            </div>
            
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
                onClick={() => onNavigate?.(connection.related_document_id)}
                className="text-xs"
              >
                View Document
              </Button>
            </div>
          </div>
        </Card>
      )}
    </span>
  );
}