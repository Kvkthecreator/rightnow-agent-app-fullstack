"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AmbientUpdateProps {
  updates: any[];
  view: string;
}

export function AmbientUpdate({ updates, view }: AmbientUpdateProps) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentUpdate, setCurrentUpdate] = useState(0);

  useEffect(() => {
    if (updates.length === 0) return;

    // Cycle through updates gently
    const interval = setInterval(() => {
      setCurrentUpdate(prev => (prev + 1) % updates.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [updates.length]);

  if (updates.length === 0) return null;

  const update = updates[currentUpdate];

  return (
    <div 
      className={`
        ambient-update
        bg-muted/80
        backdrop-blur-sm
        border
        rounded-lg
        transition-all
        duration-500
        ${isMinimized ? 'h-10' : 'h-auto'}
      `}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-full h-full px-4 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors rounded-lg"
        >
          <span className="text-muted-foreground">
            {updates.length} background {updates.length === 1 ? 'update' : 'updates'} available
          </span>
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Background Updates</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-6 px-2"
            >
              Minimize
            </Button>
          </div>
          
          <div className="space-y-2">
            {updates.map((update, idx) => (
              <div 
                key={update.id}
                className={`
                  p-2 
                  rounded 
                  text-xs 
                  transition-all
                  ${idx === currentUpdate ? 'bg-background/50 opacity-100' : 'opacity-50'}
                `}
              >
                <div className="font-medium mb-1">{update.content.title || 'Update'}</div>
                <div className="text-muted-foreground">
                  {update.content.message || update.content.summary}
                </div>
              </div>
            ))}
          </div>
          
          {/* Update indicators */}
          <div className="flex justify-center gap-1">
            {updates.map((_, idx) => (
              <div
                key={idx}
                className={`
                  h-1 
                  w-6 
                  rounded-full 
                  transition-all
                  ${idx === currentUpdate ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}