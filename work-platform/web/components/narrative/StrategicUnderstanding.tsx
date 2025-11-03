"use client";

import { Heart, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProgressiveDisclosure } from "./ProgressiveDisclosure";

interface StrategicUnderstandingProps {
  understanding: string;
  themes: string[];
  confidence?: number;
  connectionCount?: number;
  lastUpdated?: Date;
}

export function StrategicUnderstanding({ 
  understanding, 
  themes, 
  confidence = 0.85,
  connectionCount = 0,
  lastUpdated 
}: StrategicUnderstandingProps) {
  
  const getConfidenceMessage = (confidence: number): { story: string; level: string } => {
    if (confidence >= 0.9) {
      return { 
        story: "I have a strong, clear understanding of your project direction and goals",
        level: "strong"
      };
    } else if (confidence >= 0.7) {
      return { 
        story: "I'm developing a good understanding of what you're working toward",
        level: "developing"
      };
    } else if (confidence >= 0.5) {
      return { 
        story: "I'm starting to see patterns in your work and can offer some initial insights",
        level: "emerging"
      };
    } else {
      return { 
        story: "I'm just getting to know your project - please share more so I can better help",
        level: "initial"
      };
    }
  };

  const { story: confidenceStory, level } = getConfidenceMessage(confidence);
  
  const transformThemesToInsights = (themes: string[]): string[] => {
    return themes.map(theme => {
      // Transform technical themes to narrative insights
      if (theme.toLowerCase().includes('api') || theme.toLowerCase().includes('technical')) {
        return `Technical architecture and implementation`;
      }
      if (theme.toLowerCase().includes('user') || theme.toLowerCase().includes('ux')) {
        return `User experience and interface design`;
      }
      if (theme.toLowerCase().includes('data') || theme.toLowerCase().includes('analytics')) {
        return `Data strategy and insights`;
      }
      if (theme.toLowerCase().includes('business') || theme.toLowerCase().includes('strategy')) {
        return `Business strategy and planning`;
      }
      // Keep original theme if no transformation needed
      return theme;
    });
  };

  const narrativeThemes = transformThemesToInsights(themes);

  const reasoningContent = `This understanding comes from analyzing the patterns, connections, and context across everything you've shared. I'm seeing ${connectionCount > 0 ? `${connectionCount} meaningful connections` : 'several key patterns'} between your ideas and goals.`;

  const substrateContent = {
    raw_understanding: understanding,
    original_themes: themes,
    confidence_score: confidence,
    confidence_level: level,
    connection_count: connectionCount,
    last_analysis: lastUpdated?.toISOString(),
    theme_transformations: themes.map((original, index) => ({
      original,
      narrative: narrativeThemes[index]
    }))
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">What I Understand About Your Work</h2>
      </div>
      
      <ProgressiveDisclosure
        story={
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {confidenceStory}
            </p>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-lg leading-relaxed text-foreground">
                {understanding}
              </p>
            </div>
          </div>
        }
        reasoning={reasoningContent}
        substrate={substrateContent}
      >
        {narrativeThemes && narrativeThemes.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Key areas I'm seeing
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {narrativeThemes.map((theme, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ProgressiveDisclosure>
    </div>
  );
}