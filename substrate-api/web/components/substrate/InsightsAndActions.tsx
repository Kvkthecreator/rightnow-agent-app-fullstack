import React, { useState } from 'react';
import type { SubstrateIntelligence, RecommendationAction } from '@/lib/substrate/types';
import { SubstrateContentInput } from './SubstrateContentInput';

interface InsightsAndActionsProps {
  intelligence: SubstrateIntelligence['intelligence'];
  onAddContext: (content: string, type: 'text' | 'file' | 'pdf' | 'image', files?: File[]) => Promise<void>;
  onRefresh: () => void;
}

export function InsightsAndActions({ intelligence, onAddContext, onRefresh }: InsightsAndActionsProps) {
  const [isAddingContent, setIsAddingContent] = useState(false);

  const handleRecommendationAction = async (action: RecommendationAction) => {
    switch (action.type) {
      case 'add_context':
        setIsAddingContent(true);
        break;
      case 'review_document':
        // Navigate to document review - placeholder
        console.log('Document review not yet implemented');
        break;
      case 'refresh_analysis':
        await onRefresh();
        break;
      case 'export_insights':
        // Export functionality - placeholder
        console.log('Export insights not yet implemented');
        break;
      default:
        console.log('Unknown recommendation action:', action.type);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conflict_identified': return 'border-l-red-400 bg-red-50';
      case 'opportunity_found': return 'border-l-green-400 bg-green-50';  
      case 'pattern_detected': return 'border-l-blue-400 bg-blue-50';
      default: return 'border-l-gray-400 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'conflict_identified': return '⚠️';
      case 'opportunity_found': return '💡';
      case 'pattern_detected': return '🔍';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Insights Section */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Intelligence Insights</h2>
              <p className="text-sm text-gray-600">
                {intelligence.insights.length} insight{intelligence.insights.length !== 1 ? 's' : ''} discovered
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Analysis
          </button>
        </div>

        {intelligence.insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
            <p className="text-gray-600">Add more content to generate intelligence insights.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {intelligence.insights.map((insight) => (
              <div key={insight.id} className={`border-l-4 p-4 rounded-r-lg ${getTypeColor(insight.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{getTypeIcon(insight.type)}</span>
                      <span className="font-medium text-gray-900">{insight.title}</span>
                      <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border">
                        {insight.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{insight.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                      <span>Documents: {insight.affectedDocuments.length}</span>
                      <span>Source: {insight.contextSource}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Recommended Actions</h2>
            <p className="text-sm text-gray-600">
              {intelligence.recommendations.length} recommendation{intelligence.recommendations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {intelligence.recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-600">Your substrate intelligence will generate recommendations as it learns.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {intelligence.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{recommendation.title}</h3>
                    <p className="text-gray-700 text-sm mb-2">{recommendation.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>Priority: {recommendation.priority}</span>
                      <span>Expected impact: {recommendation.estimatedImpact}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {recommendation.actions.map((action) => (
                    <button
                      key={action.type}
                      onClick={() => handleRecommendationAction(action)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Universal Content Input */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
            <span className="text-lg">➕</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Context</h2>
            <p className="text-sm text-gray-600">Expand your workspace with text, files, PDFs, or images</p>
          </div>
        </div>

        <SubstrateContentInput 
          onAddContext={onAddContext}
          isVisible={true}
        />
      </div>
    </div>
  );
}