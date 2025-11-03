"use client";

import React from 'react';
import { useDetailedAnalysis } from '@/lib/hooks/useDetailedAnalysis';
import { SubstrateHealthScore } from './SubstrateHealthScore';
import { ContentVitals } from './ContentVitals';
import { EmergingPatterns } from './EmergingPatterns';
import { NextSteps } from './NextSteps';
import OrganicSpinner from '@/components/ui/OrganicSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface DetailedViewContentProps {
  basketId: string;
  basketName: string;
}

export function DetailedViewContent({ basketId, basketName }: DetailedViewContentProps) {
  const { data, loading, error, refresh } = useDetailedAnalysis(basketId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <OrganicSpinner size="lg" />
          <p className="mt-6 text-lg text-gray-600">Analyzing your substrate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={refresh}
        title="Unable to load substrate health - try refreshing"
      />
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <h2 className="text-xl font-semibold mb-2">Your substrate is ready to grow</h2>
          <p className="text-gray-600">Start by adding your first document or pasting content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Substrate Health</h1>
            <p className="mt-1 text-sm text-gray-600">
              Honest assessment of {basketName}'s development
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Health Check
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8 bg-gray-50 min-h-full">
        {/* Calculate substrate health score */}
        {(() => {
          const totalWords = data.contentInventory.documents.totalWords + data.contentInventory.rawDumps.totalWords;
          const documentCount = data.contentInventory.documents.total;
          const contextItems = data.contentInventory.contextItems.total;
          
          // Calculate health score (0-100)
          let healthScore = 0;
          
          // Base score from content volume
          if (totalWords > 0) healthScore += Math.min((totalWords / 2000) * 40, 40);
          
          // Document diversity
          if (documentCount > 0) healthScore += Math.min(documentCount * 5, 20);
          
          // Context items
          if (contextItems > 0) healthScore += Math.min(contextItems * 2, 15);
          
          // Processing completion bonus
          if (data.contentInventory.rawDumps.processed > 0) healthScore += 10;
          
          // Quality bonus for sufficient content
          if (totalWords >= 500) healthScore += 15;
          
          healthScore = Math.min(Math.round(healthScore), 100);
          
          // Extract themes from processing results or use empty array
          const themes = data.processingResults?.themes?.map((theme: any) => ({
            name: theme.name || theme.theme || String(theme),
            confidence: theme.confidence || theme.strength || 50,
            context: theme.context
          })) || [];
          
          return (
            <>
              {/* Top Level - Substrate Status */}
              <SubstrateHealthScore 
                score={healthScore}
                totalWords={totalWords}
                documentCount={documentCount}
              />

              {/* Second Level - What Exists */}
              <ContentVitals
                documents={documentCount}
                processingQueue={data.contentInventory.rawDumps.total - data.contentInventory.rawDumps.processed}
                insights={data.honestAssessment?.recommendations?.length || 0}
                lastActiveHours={0} // Would come from real data
                totalWords={totalWords}
              />

              {/* Third Level - What We See */}
              <EmergingPatterns themes={themes} />

              {/* Fourth Level - What's Next */}
              <NextSteps
                documentCount={documentCount}
                totalWords={totalWords}
                hasProcessingQueue={data.contentInventory.rawDumps.total > data.contentInventory.rawDumps.processed}
                hasInsights={(data.honestAssessment?.recommendations?.length || 0) > 0}
                basketId={basketId}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
}