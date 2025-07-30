"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type IntelligenceStatus = "idle" | "thinking" | "active" | "error" | "ready";
export type IntelligenceLevel = "basic" | "enhanced" | "advanced" | "expert";

interface StatusIndicatorProps {
  status: IntelligenceStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

interface LevelIndicatorProps {
  level: IntelligenceLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

interface ActivityIndicatorProps {
  isActive: boolean;
  intensity?: "low" | "medium" | "high";
  className?: string;
}

interface IntelligenceBadgeProps {
  type: "status" | "level" | "feature";
  content: string;
  icon?: string;
  variant?: "default" | "secondary" | "outline";
  pulsing?: boolean;
  className?: string;
}

// Status indicator with different states
export function StatusIndicator({ 
  status, 
  size = "md", 
  showLabel = false, 
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    idle: { 
      color: "bg-gray-400", 
      label: "Idle", 
      icon: "⭕" 
    },
    thinking: { 
      color: "bg-yellow-500 animate-pulse", 
      label: "Thinking", 
      icon: "🤔" 
    },
    active: { 
      color: "bg-green-500", 
      label: "Active", 
      icon: "🧠" 
    },
    error: { 
      color: "bg-red-500", 
      label: "Error", 
      icon: "⚠️" 
    },
    ready: { 
      color: "bg-blue-500", 
      label: "Ready", 
      icon: "✨" 
    }
  };

  const sizeConfig = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-full",
        config.color,
        sizeConfig[size]
      )} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
}

// Intelligence level indicator
export function LevelIndicator({ 
  level, 
  size = "md", 
  showLabel = false, 
  className 
}: LevelIndicatorProps) {
  const levelConfig = {
    basic: { 
      dots: 1, 
      color: "bg-gray-400", 
      label: "Basic" 
    },
    enhanced: { 
      dots: 2, 
      color: "bg-blue-500", 
      label: "Enhanced" 
    },
    advanced: { 
      dots: 3, 
      color: "bg-purple-500", 
      label: "Advanced" 
    },
    expert: { 
      dots: 4, 
      color: "bg-gold-500", 
      label: "Expert" 
    }
  };

  const sizeConfig = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };

  const config = levelConfig[level];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full",
              i < config.dots ? config.color : "bg-muted",
              sizeConfig[size]
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
}

// Activity indicator for ongoing AI processes
export function ActivityIndicator({ 
  isActive, 
  intensity = "medium", 
  className 
}: ActivityIndicatorProps) {
  if (!isActive) return null;

  const intensityConfig = {
    low: "animate-pulse",
    medium: "animate-bounce",
    high: "animate-spin"
  };

  return (
    <div className={cn(
      "flex items-center justify-center w-4 h-4",
      intensityConfig[intensity],
      className
    )}>
      <div className="w-2 h-2 bg-primary rounded-full" />
    </div>
  );
}

// Versatile intelligence badge
export function IntelligenceBadge({ 
  type, 
  content, 
  icon, 
  variant = "default", 
  pulsing = false,
  className 
}: IntelligenceBadgeProps) {
  const typeConfig = {
    status: "border-green-200 bg-green-50 text-green-800",
    level: "border-purple-200 bg-purple-50 text-purple-800",
    feature: "border-blue-200 bg-blue-50 text-blue-800"
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        "text-xs flex items-center gap-1",
        typeConfig[type],
        pulsing && "animate-pulse",
        className
      )}
    >
      {icon && <span>{icon}</span>}
      {content}
    </Badge>
  );
}

// Composite intelligence status display
interface IntelligenceStatusDisplayProps {
  status: IntelligenceStatus;
  level: IntelligenceLevel;
  activityIntensity?: "low" | "medium" | "high";
  features?: string[];
  compact?: boolean;
  className?: string;
}

export function IntelligenceStatusDisplay({
  status,
  level,
  activityIntensity = "medium",
  features = [],
  compact = false,
  className
}: IntelligenceStatusDisplayProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <StatusIndicator status={status} size="sm" />
        <LevelIndicator level={level} size="sm" />
        <ActivityIndicator 
          isActive={status === "thinking" || status === "active"} 
          intensity={activityIntensity} 
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIndicator status={status} showLabel />
          <LevelIndicator level={level} showLabel />
        </div>
        <ActivityIndicator 
          isActive={status === "thinking" || status === "active"} 
          intensity={activityIntensity} 
        />
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {features.map((feature, idx) => (
            <IntelligenceBadge
              key={idx}
              type="feature"
              content={feature}
              variant="outline"
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Thinking animation component
export function ThinkingAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-2">
        AI is thinking...
      </span>
    </div>
  );
}

// Progress indicator for AI processing
interface IntelligenceProgressProps {
  progress: number; // 0-100
  stage?: string;
  className?: string;
}

export function IntelligenceProgress({ 
  progress, 
  stage, 
  className 
}: IntelligenceProgressProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {stage || "Processing"}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}