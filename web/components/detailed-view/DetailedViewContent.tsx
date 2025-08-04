"use client";

import React from 'react';
import { useDetailedAnalysis } from '@/lib/hooks/useDetailedAnalysis';
import { ContentInventorySection } from './ContentInventorySection';
import { ProcessingResultsSection } from './ProcessingResultsSection';
import { HonestAssessmentSection } from './HonestAssessmentSection';
import { TruthVsFictionSection } from './TruthVsFictionSection';
import { RawDataExportSection } from './RawDataExportSection';
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
          <p className="mt-6 text-lg text-gray-600">Basket loading... please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={refresh}
        title="Failed to load detailed analysis"
      />
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-xl font-semibold mb-2">No analysis data available</h2>
          <p className="text-gray-600">This workspace may not have any content yet.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Detailed View</h1>
            <p className="mt-1 text-sm text-gray-600">
              Transparent analysis of {basketName}'s substrate processing
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8 bg-gray-50 min-h-full">
        {/* Content Inventory - Most Important */}
        <ContentInventorySection inventory={data.contentInventory} />

        {/* Processing Results - Technical Details */}
        <ProcessingResultsSection results={data.processingResults} />

        {/* Honest Assessment - Actionable Insights */}
        <HonestAssessmentSection assessment={data.honestAssessment} />

        {/* Truth vs Fiction - Trust Building */}
        <TruthVsFictionSection comparison={data.truthVsFiction} />

        {/* Raw Data Export - Power Users */}
        <RawDataExportSection rawData={data.rawData} />
      </div>
    </div>
  );
}