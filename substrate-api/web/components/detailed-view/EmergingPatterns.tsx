"use client";

import React from 'react';
import { Brain, TrendingUp, Eye } from 'lucide-react';

interface Theme {
  name: string;
  confidence: number;
  context?: string;
}

interface EmergingPatternsProps {
  themes: Theme[];
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'what', 'where', 'when', 'why', 'how', 'who', 'which', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours',
  'does', 'users', 'use', 'using', 'used', 'make', 'making', 'made', 'get', 'getting'
]);

export function EmergingPatterns({ themes }: EmergingPatternsProps) {
  // Filter out stop words and noise
  const filteredThemes = themes.filter(theme => 
    !STOP_WORDS.has(theme.name.toLowerCase()) && 
    theme.name.length > 2
  );

  // Group by confidence levels
  const strongThemes = filteredThemes.filter(t => t.confidence > 70);
  const emergingThemes = filteredThemes.filter(t => t.confidence >= 30 && t.confidence <= 70);
  const weakSignals = filteredThemes.filter(t => t.confidence < 30);

  // Group related themes semantically
  const groupRelatedThemes = (themes: Theme[]) => {
    const groups: Record<string, Theme[]> = {};
    
    themes.forEach(theme => {
      const name = theme.name.toLowerCase();
      
      // Future planning group
      if (name.includes('2025') || name.includes('planning') || name.includes('priority') || 
          name.includes('goal') || name.includes('strategy')) {
        if (!groups['Future Planning']) groups['Future Planning'] = [];
        groups['Future Planning'].push(theme);
      }
      // Technical group
      else if (name.includes('technical') || name.includes('implementation') || 
               name.includes('system') || name.includes('architecture') || name.includes('code')) {
        if (!groups['Technical']) groups['Technical'] = [];
        groups['Technical'].push(theme);
      }
      // User/Customer group
      else if (name.includes('user') || name.includes('customer') || name.includes('client')) {
        if (!groups['User Focus']) groups['User Focus'] = [];
        groups['User Focus'].push(theme);
      }
      // Business group
      else if (name.includes('business') || name.includes('revenue') || name.includes('growth')) {
        if (!groups['Business']) groups['Business'] = [];
        groups['Business'].push(theme);
      }
      // Individual themes
      else {
        if (!groups['Individual']) groups['Individual'] = [];
        groups['Individual'].push(theme);
      }
    });
    
    return groups;
  };

  const strongGroups = groupRelatedThemes(strongThemes);
  const emergingGroups = groupRelatedThemes(emergingThemes);

  const renderThemeGroup = (groupName: string, themes: Theme[], isPrimary: boolean = false) => (
    <div key={groupName} className={`p-3 rounded-lg border ${
      isPrimary 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      {groupName !== 'Individual' && (
        <div className={`text-sm font-medium mb-2 ${isPrimary ? 'text-blue-800' : 'text-gray-700'}`}>
          {groupName}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {themes.map((theme, idx) => (
          <div key={idx} className={`px-2 py-1 text-xs rounded-full ${
            isPrimary 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {theme.name}
            {theme.confidence > 30 && (
              <span className="ml-1 opacity-75">
                {Math.round(theme.confidence)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const hasStrongPatterns = Object.keys(strongGroups).length > 0;
  const hasEmergingPatterns = Object.keys(emergingGroups).length > 0;
  const hasWeakSignals = weakSignals.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-gray-500" />
          Emerging Understanding
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          What patterns we can see in your substrate
        </p>
      </div>

      {!hasStrongPatterns && !hasEmergingPatterns ? (
        // Empty state
        <div className="text-center py-8">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No strong patterns yet
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This is normal for early substrates. Patterns emerge as you add more content and context.
          </p>
          {hasWeakSignals && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                {weakSignals.length} early signals detected
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Keep adding content to strengthen these patterns
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Strong Patterns */}
          {hasStrongPatterns && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                Strong Patterns ({Object.values(strongGroups).flat().length})
              </h3>
              <div className="space-y-3">
                {Object.entries(strongGroups).map(([groupName, themes]) =>
                  renderThemeGroup(groupName, themes, true)
                )}
              </div>
            </div>
          )}

          {/* Emerging Patterns */}
          {hasEmergingPatterns && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2 text-gray-500" />
                Developing Patterns ({Object.values(emergingGroups).flat().length})
              </h3>
              <div className="space-y-3">
                {Object.entries(emergingGroups).map(([groupName, themes]) =>
                  renderThemeGroup(groupName, themes, false)
                )}
              </div>
            </div>
          )}

          {/* Weak Signals */}
          {hasWeakSignals && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-700">
                <TrendingUp className="h-4 w-4 inline mr-1" />
                {weakSignals.length} additional early signals detected
              </div>
              <div className="text-xs text-gray-600 mt-1">
                These may become meaningful patterns with more context
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}