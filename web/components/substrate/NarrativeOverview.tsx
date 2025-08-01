import React from 'react';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

interface NarrativeOverviewProps {
  contextUnderstanding: SubstrateIntelligence['contextUnderstanding'];
  substrateHealth: SubstrateIntelligence['substrateHealth'];
}

export function NarrativeOverview({ contextUnderstanding, substrateHealth }: NarrativeOverviewProps) {
  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 0.8) return '✨';
    if (score >= 0.6) return '⚡';
    return '⚠️';
  };

  const getEvolutionIcon = (rate: string) => {
    switch (rate) {
      case 'active': return '🔥';
      case 'growing': return '🌱';
      case 'stable': return '✅';
      default: return '📊';
    }
  };

  const getEvolutionDescription = (rate: string) => {
    switch (rate) {
      case 'active': return 'rapidly evolving with frequent updates';
      case 'growing': return 'steadily developing with new insights';
      case 'stable': return 'well-established and consistent';
      default: return 'maintaining steady progress';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Context Understanding</h2>
          <div className="prose text-gray-700 max-w-none">
            <p className="mb-4 text-base leading-relaxed">
              I'm managing your <strong className="text-blue-600">{contextUnderstanding.themes.join(', ').toLowerCase()}</strong> workspace, 
              keeping your documents aligned and current with your evolving context. My understanding grows with every addition you make.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="mb-0 text-blue-800">
                <strong>Your intent:</strong> {contextUnderstanding.intent}
              </p>
            </div>
            <p className="mb-0 text-base">
              I'm currently tracking <strong>{contextUnderstanding.themes.length} key theme{contextUnderstanding.themes.length !== 1 ? 's' : ''}</strong> across your 
              documents and maintaining coherence between your strategic thinking and tactical execution.
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={getHealthIcon(substrateHealth.contextQuality)}/>
              <span className="text-gray-600">Context Quality:</span>
            </div>
            <span className={`font-semibold ${getHealthColor(substrateHealth.contextQuality)}`}>
              {Math.round(substrateHealth.contextQuality * 100)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={getHealthIcon(substrateHealth.documentAlignment)}/>
              <span className="text-gray-600">Document Alignment:</span>
            </div>
            <span className={`font-semibold ${getHealthColor(substrateHealth.documentAlignment)}`}>
              {Math.round(substrateHealth.documentAlignment * 100)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between md:justify-end">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900 flex items-center space-x-1">
                <span>{getEvolutionIcon(substrateHealth.evolutionRate)}</span>
                <span className="capitalize">{substrateHealth.evolutionRate}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Your context is <strong>{getEvolutionDescription(substrateHealth.evolutionRate)}</strong>. 
            Last analyzed: {new Date(contextUnderstanding.lastAnalysis).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}