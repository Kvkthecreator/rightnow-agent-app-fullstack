"use client";

import React from 'react';
import { FileText, Clock, Lightbulb, Activity } from 'lucide-react';

interface ContentVitalsProps {
  documents: number;
  processingQueue: number;
  insights: number;
  lastActiveHours: number;
  totalWords: number;
}

export function ContentVitals({ 
  documents, 
  processingQueue, 
  insights, 
  lastActiveHours, 
  totalWords 
}: ContentVitalsProps) {
  const vitals = [
    {
      icon: FileText,
      label: 'Documents',
      value: documents,
      emptyState: 'Ready for first document',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Activity,
      label: 'Processing',
      value: processingQueue,
      emptyState: 'All content processed',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      suffix: processingQueue > 0 ? 'in queue' : undefined
    },
    {
      icon: Lightbulb,
      label: 'Insights',
      value: insights,
      emptyState: 'Building understanding',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      suffix: insights > 0 ? 'discovered' : undefined
    },
    {
      icon: Clock,
      label: 'Last Active',
      value: lastActiveHours,
      emptyState: 'Just now',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      suffix: lastActiveHours > 0 ? `${lastActiveHours}h ago` : undefined,
      displayValue: lastActiveHours === 0 ? 'Now' : `${lastActiveHours}h ago`
    }
  ];

  const getWordStage = () => {
    if (totalWords === 0) return { stage: 'Empty', color: 'text-gray-600' };
    if (totalWords < 500) return { stage: 'Early Stage', color: 'text-green-600' };
    if (totalWords < 2000) return { stage: 'Building', color: 'text-blue-600' };
    return { stage: 'Established', color: 'text-purple-600' };
  };

  const wordStage = getWordStage();

  return (
    <div className="space-y-6">
      {/* Content Stage Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Content Stage</h3>
            <p className="text-sm text-gray-600 mt-1">Current substrate development</p>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${wordStage.color}`}>
              {wordStage.stage}
            </div>
            <div className="text-sm text-gray-600">
              {totalWords.toLocaleString()} words
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {vitals.map((vital, index) => {
          const IconComponent = vital.icon;
          const isEmpty = vital.value === 0;
          
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${vital.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${vital.color}`} />
                </div>
                {!isEmpty && (
                  <span className={`text-2xl font-bold ${vital.color}`}>
                    {vital.displayValue || vital.value}
                  </span>
                )}
              </div>
              
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {vital.label}
              </h4>
              
              {isEmpty ? (
                <div className="text-xs text-gray-600">
                  {vital.emptyState}
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  {vital.displayValue ? '' : vital.value} {vital.suffix || ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}