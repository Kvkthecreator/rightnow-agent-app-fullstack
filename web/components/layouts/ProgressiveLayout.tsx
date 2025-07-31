"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight, Info, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ProgressiveLayoutProps {
  children: ReactNode;
  title?: string;
  defaultLevel?: 'story' | 'reasoning' | 'substrate';
  showLevelIndicator?: boolean;
  onLevelChange?: (level: 'story' | 'reasoning' | 'substrate') => void;
  className?: string;
}

export function ProgressiveLayout({ 
  children, 
  title, 
  defaultLevel = 'story',
  showLevelIndicator = true,
  onLevelChange,
  className = ""
}: ProgressiveLayoutProps) {
  const [currentLevel, setCurrentLevel] = useState<'story' | 'reasoning' | 'substrate'>(defaultLevel);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLevelChange = (level: 'story' | 'reasoning' | 'substrate') => {
    setCurrentLevel(level);
    onLevelChange?.(level);
  };

  const getLevelConfig = (level: 'story' | 'reasoning' | 'substrate') => {
    switch (level) {
      case 'story':
        return {
          label: 'Story',
          description: 'Natural, conversational view',
          icon: Eye,
          color: 'bg-green-100 text-green-800 border-green-200',
          priority: 1
        };
      case 'reasoning':
        return {
          label: 'How I Know',
          description: 'Reasoning and methodology',
          icon: Info,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          priority: 2
        };
      case 'substrate':
        return {
          label: 'Technical',
          description: 'Raw data and implementation details',
          icon: Settings,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          priority: 3
        };
    }
  };

  const levels: Array<'story' | 'reasoning' | 'substrate'> = ['story', 'reasoning', 'substrate'];
  const currentConfig = getLevelConfig(currentLevel);
  const CurrentIcon = currentConfig.icon;

  return (
    <div className={`progressive-layout ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="text-sm">Details</span>
          </Button>
        </div>
      )}

      {showLevelIndicator && isExpanded && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrentIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">View Level</span>
          </div>
          
          <div className="flex items-center gap-2">
            {levels.map((level) => {
              const config = getLevelConfig(level);
              const Icon = config.icon;
              const isActive = level === currentLevel;
              
              return (
                <Button
                  key={level}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLevelChange(level)}
                  className={`flex items-center gap-2 transition-all ${
                    isActive ? config.color : 'hover:bg-muted/60'
                  } ${isActive ? 'scale-105' : ''}`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-xs font-medium">{config.label}</span>
                </Button>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {currentConfig.description}
          </p>
        </div>
      )}

      <div className={`progressive-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {children}
      </div>

      {/* Progressive disclosure hint for new users */}
      {currentLevel === 'story' && showLevelIndicator && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border-l-4 border-primary/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">
                Want to see how I know this?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "How I Know" to see my reasoning, or "Technical" for raw data.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLevelChange('reasoning')}
              className="text-xs"
            >
              Show me
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}