"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, Brain, Link2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GentleNotificationProps {
  id: string;
  type: 'insight' | 'connection' | 'suggestion' | 'progress';
  content: any;
  onDismiss: (id: string) => void;
  autoHide?: boolean;
  duration?: number;
}

export function GentleNotification({
  id,
  type,
  content,
  onDismiss,
  autoHide = true,
  duration = 5000
}: GentleNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Gentle fade in
    const showTimer = setTimeout(() => setIsVisible(true), 100);

    // Auto hide if enabled
    let hideTimer: NodeJS.Timeout;
    if (autoHide) {
      hideTimer = setTimeout(() => {
        handleDismiss();
      }, duration);
    }

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [autoHide, duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'insight':
        return <Sparkles className="h-4 w-4" />;
      case 'connection':
        return <Link2 className="h-4 w-4" />;
      case 'suggestion':
        return <Brain className="h-4 w-4" />;
      case 'progress':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'insight':
        return "New Insight Discovered";
      case 'connection':
        return "Connection Found";
      case 'suggestion':
        return "Suggestion Available";
      case 'progress':
        return "Progress Update";
      default:
        return "Update";
    }
  };

  return (
    <div
      className={`
        gentle-notification
        bg-background/95 
        backdrop-blur-sm 
        border 
        rounded-lg 
        shadow-lg 
        p-4 
        max-w-sm
        transition-all
        duration-300
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-primary mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{getTitle()}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {content.message || content.summary || "I found something that might interest you"}
          </p>
          
          {content.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs p-0 h-auto mt-2"
              onClick={content.onAction}
            >
              {content.actionLabel} →
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex-shrink-0 h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden rounded-b-lg">
          <div 
            className="h-full bg-primary/30 animate-progress"
            style={{ 
              animationDuration: `${duration}ms`,
              animationTimingFunction: 'linear'
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        .animate-progress {
          animation-name: progress;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}