"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TooltipProps {
  targetSelector: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  action?: {
    text: string;
    onClick: () => void;
  };
  onComplete?: () => void;
  onSkip?: () => void;
  show: boolean;
}

interface DiscoverySequence {
  id: string;
  tooltips: Omit<TooltipProps, 'show'>[];
  autoAdvance?: boolean;
  delay?: number;
}

interface FeatureDiscoveryTooltipsProps {
  sequence: DiscoverySequence;
  active: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function FeatureDiscoveryTooltips({
  sequence,
  active,
  onComplete,
  onSkip
}: FeatureDiscoveryTooltipsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});

  // Calculate tooltip positions
  useEffect(() => {
    if (!active) return;

    const calculatePositions = () => {
      const newPositions: Record<number, { x: number; y: number }> = {};
      
      sequence.tooltips.forEach((tooltip, index) => {
        const element = document.querySelector(tooltip.targetSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const placement = tooltip.placement || "top";
          
          let x = rect.left + rect.width / 2;
          let y = rect.top;
          
          switch (placement) {
            case "top":
              y = rect.top - 10;
              break;
            case "bottom":
              y = rect.bottom + 10;
              break;
            case "left":
              x = rect.left - 10;
              y = rect.top + rect.height / 2;
              break;
            case "right":
              x = rect.right + 10;
              y = rect.top + rect.height / 2;
              break;
          }
          
          newPositions[index] = { x, y };
        }
      });
      
      setPositions(newPositions);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    return () => window.removeEventListener('resize', calculatePositions);
  }, [active, sequence.tooltips, currentStep]);

  // Auto-advance logic
  useEffect(() => {
    if (!active || !sequence.autoAdvance) return;

    const timer = setTimeout(() => {
      if (currentStep < sequence.tooltips.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete();
      }
    }, sequence.delay || 4000);

    return () => clearTimeout(timer);
  }, [currentStep, active, sequence.autoAdvance, sequence.delay, sequence.tooltips.length, onComplete]);

  if (!active || sequence.tooltips.length === 0) return null;

  const currentTooltip = sequence.tooltips[currentStep];
  const position = positions[currentStep];

  if (!position || !currentTooltip) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onSkip} />
      
      {/* Spotlight effect on target element */}
      <div 
        className="fixed z-50 pointer-events-none"
        style={{
          left: position.x - 50,
          top: position.y - 50,
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }}
      />

      {/* Tooltip */}
      <Card 
        className={cn(
          "fixed z-50 p-4 max-w-xs shadow-lg animate-in fade-in-0 zoom-in-95",
          currentTooltip.placement === "top" && "transform -translate-x-1/2 -translate-y-full mb-2",
          currentTooltip.placement === "bottom" && "transform -translate-x-1/2 mt-2",
          currentTooltip.placement === "left" && "transform -translate-x-full -translate-y-1/2 mr-2",
          currentTooltip.placement === "right" && "transform -translate-y-1/2 ml-2"
        )}
        style={{
          left: currentTooltip.placement === "left" ? position.x - 10 : 
                currentTooltip.placement === "right" ? position.x + 10 : 
                position.x,
          top: currentTooltip.placement === "top" ? position.y - 10 : 
               currentTooltip.placement === "bottom" ? position.y + 10 : 
               position.y
        }}
      >
        {/* Tooltip arrow */}
        <div 
          className={cn(
            "absolute w-3 h-3 bg-background border rotate-45",
            currentTooltip.placement === "top" && "bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-0 border-l-0",
            currentTooltip.placement === "bottom" && "top-[-6px] left-1/2 transform -translate-x-1/2 border-b-0 border-r-0",
            currentTooltip.placement === "left" && "right-[-6px] top-1/2 transform -translate-y-1/2 border-l-0 border-b-0",
            currentTooltip.placement === "right" && "left-[-6px] top-1/2 transform -translate-y-1/2 border-r-0 border-t-0"
          )}
        />

        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{currentTooltip.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {currentTooltip.description}
              </p>
            </div>
            <button
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground text-sm ml-2"
            >
              ×
            </button>
          </div>

          {/* Action button */}
          {currentTooltip.action && (
            <Button
              size="sm"
              onClick={currentTooltip.action.onClick}
              className="w-full text-xs"
            >
              {currentTooltip.action.text}
            </Button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {sequence.tooltips.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    idx === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="text-xs px-2"
                >
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  if (currentStep < sequence.tooltips.length - 1) {
                    setCurrentStep(prev => prev + 1);
                  } else {
                    onComplete();
                  }
                }}
                className="text-xs px-2"
              >
                {currentStep < sequence.tooltips.length - 1 ? "Next" : "Done"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// Predefined discovery sequences
export const DISCOVERY_SEQUENCES = {
  brainSidebarIntro: {
    id: "brain-sidebar-intro",
    tooltips: [
      {
        targetSelector: "[data-discovery='brain-toggle']",
        title: "Your AI Brain",
        description: "Click here to access your intelligent thinking partner",
        placement: "left" as const,
        action: {
          text: "Open Brain",
          onClick: () => {
            const element = document.querySelector("[data-discovery='brain-toggle']") as HTMLElement;
            element?.click();
          }
        }
      },
      {
        targetSelector: "[data-discovery='brain-context']",
        title: "Context Panel",
        description: "See what your AI understands about your current work",
        placement: "left" as const
      },
      {
        targetSelector: "[data-discovery='brain-suggestions']",
        title: "Smart Suggestions",
        description: "Get AI-powered ideas and next steps for your project",
        placement: "left" as const
      },
      {
        targetSelector: "[data-discovery='brain-memory']",
        title: "Memory Insights",
        description: "Connect your current work to past projects and ideas",
        placement: "left" as const
      }
    ],
    autoAdvance: false
  },

  documentWorkflow: {
    id: "document-workflow",
    tooltips: [
      {
        targetSelector: "[data-discovery='create-document']",
        title: "Create Documents",
        description: "Turn your ideas into structured documents with AI assistance",
        placement: "top" as const
      },
      {
        targetSelector: "[data-discovery='document-list']",
        title: "Document Library",
        description: "All your documents are organized and searchable here",
        placement: "right" as const
      }
    ],
    autoAdvance: true,
    delay: 3000
  }
};