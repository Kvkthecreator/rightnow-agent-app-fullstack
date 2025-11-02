"use client";

import React from 'react';
import { Brain } from 'lucide-react';

interface ExecutiveSummaryProps {
  intelligence: any;
  basketName: string;
  documentCount: number;
  totalWords: number;
}

export function ExecutiveSummary({ 
  intelligence, 
  basketName, 
  documentCount, 
  totalWords 
}: ExecutiveSummaryProps) {
  const generateHonestSummary = () => {
    // No content case
    if (documentCount === 0 && totalWords === 0) {
      return (
        <p className="text-gray-700 leading-relaxed">
          Your substrate is just beginning. Add documents or paste content to start building understanding. 
          Every research journey starts with that first piece of material - upload something meaningful to you 
          and I'll help you explore what patterns and connections emerge.
        </p>
      );
    }

    // Minimal content case
    if (totalWords < 500) {
      const themes = intelligence?.contextUnderstanding?.themes?.slice(0, 2) || [];
      const hasThemes = themes.length > 0;
      
      return (
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Early patterns are emerging from your {documentCount} document{documentCount !== 1 ? 's' : ''}. 
            With {totalWords.toLocaleString()} words of content, I can see the foundation of your research taking shape.
          </p>
          {hasThemes && (
            <p className="text-gray-700 leading-relaxed">
              Initial themes appearing include {themes.map((t: any) => t.name || t).join(' and ')}. 
              Add more strategic content to strengthen these patterns and reveal deeper insights.
            </p>
          )}
        </div>
      );
    }

    // Building content case
    if (totalWords < 2000) {
      const themes = intelligence?.contextUnderstanding?.themes?.slice(0, 3) || [];
      const insights = intelligence?.intelligence?.insights?.slice(0, 2) || [];
      
      return (
        <div className="space-y-3">
          <p className="text-gray-700 leading-relaxed">
            Your substrate is building momentum with {documentCount} documents and {totalWords.toLocaleString()} words. 
            Clear patterns are emerging around {themes.length > 0 ? themes.map((t: any) => t.name || t).slice(0, 2).join(' and ') : 'your core focus areas'}.
          </p>
          {insights.length > 0 && (
            <p className="text-gray-700 leading-relaxed">
              Key insight developing: {insights[0]?.description || insights[0] || 'connections between your materials are becoming clearer'}. 
              Your research direction is gaining clarity and depth.
            </p>
          )}
        </div>
      );
    }

    // Rich content case
    const themes = intelligence?.contextUnderstanding?.themes?.slice(0, 4) || [];
    const insights = intelligence?.intelligence?.insights?.slice(0, 3) || [];
    const recommendations = intelligence?.intelligence?.recommendations?.slice(0, 2) || [];
    
    return (
      <div className="space-y-3">
        <p className="text-gray-700 leading-relaxed">
          Your research substrate is well-developed with {documentCount} documents containing {totalWords.toLocaleString()} words of analysis. 
          Strong patterns have emerged around {themes.length > 0 ? themes.map((t: any) => t.name || t).slice(0, 3).join(', ') : 'your research themes'}, 
          creating a rich foundation for deeper exploration.
        </p>
        {insights.length > 0 && (
          <p className="text-gray-700 leading-relaxed">
            Current understanding centers on {insights[0]?.description || 'the interconnections within your research'}. 
            {insights.length > 1 && `Additional insights include ${insights[1]?.description || 'emerging patterns that support your main thesis'}.`}
          </p>
        )}
        {recommendations.length > 0 && (
          <p className="text-gray-700 leading-relaxed">
            Your substrate suggests {recommendations[0]?.description || 'continuing to build on your established patterns'} 
            to deepen your research impact and clarity.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <span className="text-xl">🧠</span>
          Executive Summary
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Current state of your research substrate
        </p>
      </div>
      
      <div className="prose-sm max-w-none">
        {generateHonestSummary()}
      </div>
    </div>
  );
}