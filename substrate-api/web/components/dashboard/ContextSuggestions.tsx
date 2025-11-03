"use client";

import React, { useState } from 'react';
import { FileText, BarChart3, Map, Layers, ChevronRight, Eye, Sparkles } from 'lucide-react';

interface ContextSuggestion {
  type: 'document_creation' | 'analysis' | 'roadmap' | 'framework';
  title: string;
  reasoning: string;
  preview: string;
  confidence: number;
}

interface ContextSuggestionsProps {
  suggestions: ContextSuggestion[];
  onSuggestionSelect: (suggestion: ContextSuggestion) => void;
}

const suggestionIcons = {
  document_creation: FileText,
  analysis: BarChart3,
  roadmap: Map,
  framework: Layers
};

const suggestionColors = {
  document_creation: 'text-blue-600 bg-blue-50 border-blue-200',
  analysis: 'text-green-600 bg-green-50 border-green-200',
  roadmap: 'text-purple-600 bg-purple-50 border-purple-200',
  framework: 'text-orange-600 bg-orange-50 border-orange-200'
};

export function ContextSuggestions({ suggestions, onSuggestionSelect }: ContextSuggestionsProps) {
  const [hoveredSuggestion, setHoveredSuggestion] = useState<number | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<number | null>(null);

  const getConfidenceWidth = (confidence: number) => `${confidence * 100}%`;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-blue-500';
    if (confidence >= 0.4) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">🎯</span>
        <h2 className="text-lg font-semibold text-gray-900">What You Could Do Next</h2>
        {suggestions.length > 0 && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {suggestions.length} personalized {suggestions.length === 1 ? 'opportunity' : 'opportunities'}
          </span>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestionIcons[suggestion.type];
            const colorClass = suggestionColors[suggestion.type];
            const isHovered = hoveredSuggestion === index;
            const isExpanded = expandedPreview === index;

            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
                onMouseEnter={() => setHoveredSuggestion(index)}
                onMouseLeave={() => setHoveredSuggestion(null)}
              >
                <div className="p-4">
                  {/* Main Suggestion */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {suggestion.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {suggestion.reasoning}
                          </p>
                          
                          {/* Confidence Bar */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Confidence:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-24">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${getConfidenceColor(suggestion.confidence)}`}
                                style={{ width: getConfidenceWidth(suggestion.confidence) }}
                              />
                            </div>
                            <span className="font-medium">{Math.round(suggestion.confidence * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {isHovered && (
                            <button
                              onClick={() => setExpandedPreview(isExpanded ? null : index)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Preview what would be created"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => onSuggestionSelect(suggestion)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                              isHovered 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isHovered ? (
                              <>
                                <Sparkles className="h-3 w-3" />
                                <span>Create</span>
                              </>
                            ) : (
                              <>
                                <span>Begin</span>
                                <ChevronRight className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Preview */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Preview of what would be created:</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-700 whitespace-pre-line">
                          {suggestion.preview}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        This preview is generated based on your current context and thinking patterns.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Building personalized suggestions</h3>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            As you add more context and develop your thinking, I'll suggest specific actions tailored to your work.
          </p>
        </div>
      )}

      {/* Suggestion Types Legend */}
      {suggestions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-3">Suggestion types:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-blue-600" />
              <span className="text-gray-600">Document creation</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-green-600" />
              <span className="text-gray-600">Analysis & insights</span>
            </div>
            <div className="flex items-center gap-2">
              <Map className="h-3 w-3 text-purple-600" />
              <span className="text-gray-600">Strategic roadmaps</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-orange-600" />
              <span className="text-gray-600">Frameworks</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}