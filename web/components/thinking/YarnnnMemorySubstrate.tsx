"use client";

import React from 'react';
import { Brain, Sparkles, Heart } from 'lucide-react';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

interface YarnnnMemorySubstrateProps {
  intelligence: SubstrateIntelligence | null;
  basketName: string;
  className?: string;
}

/**
 * Pure substrate memory display - focuses on human understanding
 * Removes technical complexity, shows memory in human terms
 */
export function YarnnnMemorySubstrate({ 
  intelligence, 
  basketName,
  className = '' 
}: YarnnnMemorySubstrateProps) {
  if (!intelligence) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
          <Brain className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Building memory together</h3>
        <p className="text-gray-600">As you share your thoughts, I'll help you understand what you're becoming.</p>
      </div>
    );
  }

  const themes = intelligence.insights?.themes || [];
  const keyInsights = intelligence.insights?.keyInsights || [];
  const understanding = intelligence.contextUnderstanding?.intent || '';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Research Understanding */}
      {understanding && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-purple-900 mb-1">What I understand about your research</h4>
              <p className="text-purple-800 text-sm leading-relaxed">{understanding}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Themes */}
      {themes.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Themes I'm tracking
          </h4>
          <div className="space-y-2">
            {themes.slice(0, 5).map((theme, index) => (
              <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <h5 className="font-medium text-amber-900 text-sm">
                  {theme.title || theme.name || theme}
                </h5>
                {theme.description && (
                  <p className="text-amber-800 text-xs mt-1">{theme.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" />
            Insights I remember
          </h4>
          <div className="space-y-2">
            {keyInsights.slice(0, 4).map((insight, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-800 text-sm leading-relaxed">
                  {insight.description || insight.title || insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Growth Indicator */}
      <div className="p-4 bg-gray-50 rounded-xl text-center">
        <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
        </div>
        <p className="text-sm text-gray-600">
          Memory grows with every conversation
        </p>
      </div>
    </div>
  );
}