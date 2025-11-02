"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export type UserLevel = "new" | "intermediate" | "advanced";
export type DiscoveryStage = 1 | 2 | 3 | 4;

interface IntelligenceIntroductionProps {
  userLevel: UserLevel;
  currentContext: "dashboard" | "document" | "insights";
  discoveryStage: DiscoveryStage;
  onComplete: (stage: DiscoveryStage) => void;
  onSkip: () => void;
  className?: string;
}

interface StageConfig {
  title: string;
  description: string;
  features: Array<{
    icon: string;
    name: string;
    description: string;
    demoAction?: () => void;
  }>;
  ctaText: string;
  skipText: string;
}

export default function IntelligenceIntroduction({
  userLevel,
  currentContext,
  discoveryStage,
  onComplete,
  onSkip,
  className
}: IntelligenceIntroductionProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  // Configuration for each discovery stage
  const stageConfigs: Record<DiscoveryStage, StageConfig> = {
    1: {
      title: "Meet your AI thinking partner",
      description: "I work alongside you, providing contextual insights and suggestions as you build your projects.",
      features: [
        {
          icon: "👁️",
          name: "Context Awareness",
          description: "I understand what you're working on and provide relevant insights"
        },
        {
          icon: "💡",
          name: "Smart Suggestions", 
          description: "Get ideas for next steps, connections, and improvements"
        },
        {
          icon: "🧩",
          name: "Memory Connections",
          description: "I remember your past work and help you build on it"
        }
      ],
      ctaText: "Show me how it works",
      skipText: "Maybe later"
    },
    2: {
      title: "Contextual Intelligence",
      description: "I adapt my assistance based on what you're doing - whether editing documents, reviewing projects, or exploring insights.",
      features: [
        {
          icon: "📊",
          name: "Dashboard Mode",
          description: "Project overview, patterns, and strategic insights"
        },
        {
          icon: "📝",
          name: "Document Mode", 
          description: "Writing assistance, clarity improvements, and connections"
        },
        {
          icon: "🎯",
          name: "Insights Mode",
          description: "Deep analysis, cross-project patterns, and innovation opportunities"
        }
      ],
      ctaText: "Explore different modes",
      skipText: "I got it"
    },
    3: {
      title: "Advanced Intelligence Features",
      description: "Unlock sophisticated capabilities that grow with your expertise and project complexity.",
      features: [
        {
          icon: "🔍",
          name: "Pattern Recognition",
          description: "Identify themes and connections across all your work"
        },
        {
          icon: "🗺️",
          name: "Strategic Mapping",
          description: "Visualize project relationships and opportunity spaces"
        },
        {
          icon: "🚀",
          name: "Innovation Catalyst",
          description: "Generate breakthrough ideas from your existing knowledge"
        }
      ],
      ctaText: "Try advanced features",
      skipText: "Keep it simple for now"
    },
    4: {
      title: "Intelligence Partnership",
      description: "Work with AI as a true thinking partner. The more you engage, the more valuable our collaboration becomes.",
      features: [
        {
          icon: "🤝",
          name: "Collaborative Thinking",
          description: "Engage in back-and-forth strategic conversations"
        },
        {
          icon: "📈",
          name: "Continuous Learning",
          description: "I adapt to your style and preferences over time"
        },
        {
          icon: "⚡",
          name: "Proactive Insights",
          description: "I'll surface relevant ideas before you even ask"
        }
      ],
      ctaText: "Start partnership",
      skipText: "I'll explore on my own"
    }
  };

  const config = stageConfigs[discoveryStage];

  // Auto-cycle through features for demonstration
  useEffect(() => {
    if (discoveryStage === 1) {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % config.features.length);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [discoveryStage, config.features.length]);

  // Adjust content based on user level
  const getAdjustedContent = () => {
    if (userLevel === "new") {
      return config;
    } else if (userLevel === "intermediate") {
      return {
        ...config,
        description: config.description + " You seem familiar with the basics - let me show you the advanced capabilities."
      };
    } else {
      return {
        ...config,
        title: "Advanced Intelligence Features Available",
        description: "You're ready for the full power of our intelligence platform."
      };
    }
  };

  const adjustedConfig = getAdjustedContent();

  return (
    <div className={cn(
      "absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4",
      className
    )}>
      <Card className="w-full max-w-lg p-6 space-y-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-3xl">🧠</div>
          <h2 className="text-xl font-semibold">{adjustedConfig.title}</h2>
          <p className="text-sm text-muted-foreground">
            {adjustedConfig.description}
          </p>
          <Badge variant="outline" className="text-xs">
            Stage {discoveryStage} of 4
          </Badge>
        </div>

        {/* Features showcase */}
        <div className="space-y-4">
          {adjustedConfig.features.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                currentFeature === idx && discoveryStage === 1 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/20",
                showAnimation && currentFeature === idx && "scale-105"
              )}
            >
              <div className="text-xl">{feature.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{feature.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={() => onComplete(discoveryStage)}
            className="flex-1"
          >
            {adjustedConfig.ctaText}
          </Button>
          <Button 
            variant="ghost" 
            onClick={onSkip}
            className="flex-1"
          >
            {adjustedConfig.skipText}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center">
          {[1, 2, 3, 4].map((stage) => (
            <div
              key={stage}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                stage <= discoveryStage ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}