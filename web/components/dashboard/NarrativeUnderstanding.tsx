"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Eye, HelpCircle } from 'lucide-react';

interface NarrativeUnderstandingProps {
  userThinkingPatterns: string[];
  dominantThemes: string[];
  uncertainty: string[];
  readinessForExecution: boolean;
  personalizedInsight: string;
  confidenceLevel: number;
}

export function NarrativeUnderstanding({
  userThinkingPatterns,
  dominantThemes,
  uncertainty,
  readinessForExecution,
  personalizedInsight,
  confidenceLevel
}: NarrativeUnderstandingProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceColor = (level: number) => {
    if (level >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (level >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (level >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceText = (level: number) => {
    if (level >= 0.8) return 'High confidence in understanding';
    if (level >= 0.6) return 'Good understanding developing';
    if (level >= 0.4) return 'Building understanding';
    return 'Early stage understanding';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h2 className="text-lg font-semibold text-gray-900">Executive Summary</h2>
        </div>
        
        <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getConfidenceColor(confidenceLevel)}`}>
          {Math.round(confidenceLevel * 100)}% • {getConfidenceText(confidenceLevel)}
        </div>
      </div>

      {/* Main Insight */}
      <div className="mb-6">
        <div className="text-gray-800 leading-relaxed text-base">
          {personalizedInsight}
        </div>
      </div>

      {/* Thinking Patterns Preview */}
      {dominantThemes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Dominant themes in your thinking:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dominantThemes.slice(0, 3).map((theme, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
              >
                {theme}
              </span>
            ))}
            {dominantThemes.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-sm hover:bg-gray-100 transition-colors"
              >
                +{dominantThemes.length - 3} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Readiness Indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${readinessForExecution ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {readinessForExecution 
              ? "Ready to help you bridge insights into strategic frameworks"
              : "Building understanding to enable strategic support"
            }
          </span>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-6">
          {/* All Thinking Patterns */}
          {userThinkingPatterns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Thinking patterns I'm observing:</span>
              </div>
              <div className="space-y-2">
                {userThinkingPatterns.map((pattern, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>{pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Themes */}
          {dominantThemes.length > 3 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">All themes:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dominantThemes.map((theme, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Areas of Uncertainty */}
          {uncertainty.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Areas where you might benefit from clarity:</span>
              </div>
              <div className="space-y-2">
                {uncertainty.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Understanding Development */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How my understanding develops:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• I analyze patterns in how you think and structure ideas</div>
              <div>• I identify recurring themes and conceptual frameworks</div>
              <div>• I note areas where you express confidence vs uncertainty</div>
              <div>• I track readiness for different types of strategic support</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}