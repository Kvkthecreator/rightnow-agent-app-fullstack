"use client";

import { Brain, Lightbulb, Target, TrendingUp } from "lucide-react";
import { transformConfidenceToNarrative, transformHealthToNarrative } from "@/lib/narrative/utils/languageTransformation";

interface ProgressIndicatorsProps {
  confidence?: string | number;
  health?: string;
  themes?: number;
  insights?: number;
  className?: string;
}

export function ProgressIndicators({ 
  confidence, 
  health, 
  themes = 0, 
  insights = 0,
  className = "" 
}: ProgressIndicatorsProps) {
  const confidenceNarrative = confidence ? transformConfidenceToNarrative(confidence) : null;
  const healthNarrative = health ? transformHealthToNarrative(health) : null;

  return (
    <div className={`progress-indicators grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Understanding Strength */}
      {confidenceNarrative && (
        <div className="indicator-card bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-${confidenceNarrative.color}-100`}>
              <Brain className={`h-4 w-4 text-${confidenceNarrative.color}-600`} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {confidenceNarrative.level}
              </div>
              <div className="text-xs text-gray-500">Understanding</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`bg-${confidenceNarrative.color}-500 h-2 rounded-full transition-all duration-500`}
              style={{ width: `${confidenceNarrative.strength * 100}%` }}
            ></div>
          </div>
          
          <div className="text-xs text-gray-600 leading-tight">
            {confidenceNarrative.description}
          </div>
        </div>
      )}

      {/* Project Health */}
      {healthNarrative && (
        <div className="indicator-card bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-${healthNarrative.color}-100`}>
              <TrendingUp className={`h-4 w-4 text-${healthNarrative.color}-600`} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {healthNarrative.level}
              </div>
              <div className="text-xs text-gray-500">Project Health</div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 leading-tight">
            {healthNarrative.description}
          </div>
        </div>
      )}

      {/* Discovered Themes */}
      <div className="indicator-card bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-100">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {themes} {themes === 1 ? 'Theme' : 'Themes'}
            </div>
            <div className="text-xs text-gray-500">Discovered</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 leading-tight">
          {themes === 0 && "Add content to discover themes"}
          {themes === 1 && "One clear theme emerging"}
          {themes > 1 && themes <= 3 && `${themes} themes taking shape`}
          {themes > 3 && `Rich thematic development with ${themes} themes`}
        </div>
      </div>

      {/* Captured Insights */}
      <div className="indicator-card bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-100">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {insights} {insights === 1 ? 'Insight' : 'Insights'}
            </div>
            <div className="text-xs text-gray-500">Captured</div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 leading-tight">
          {insights === 0 && "Ready to capture your first insight"}
          {insights === 1 && "Great start with your first insight"}
          {insights > 1 && insights <= 5 && `Building momentum with ${insights} insights`}
          {insights > 5 && `Rich collection of ${insights} insights`}
        </div>
      </div>
    </div>
  );
}

interface SimpleProgressIndicatorProps {
  label: string;
  value: string | number;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'amber';
  icon?: React.ReactNode;
  progress?: number; // 0-1 for progress bar
}

export function SimpleProgressIndicator({ 
  label, 
  value, 
  description, 
  color = 'blue',
  icon,
  progress 
}: SimpleProgressIndicatorProps) {
  return (
    <div className="simple-progress-indicator bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <div className={`text-${color}-600`}>
              {icon}
            </div>
          </div>
        )}
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
      
      {progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
            style={{ width: `${progress * 100}%` }}
          ></div>
        </div>
      )}
      
      {description && (
        <div className="text-xs text-gray-600 leading-tight">
          {description}
        </div>
      )}
    </div>
  );
}