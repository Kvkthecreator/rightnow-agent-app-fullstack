import React from 'react';
import { BarChart, TestTube, Search } from 'lucide-react';

interface ProcessingResultsProps {
  results: {
    themesDetected: Array<{
      name: string;
      confidence: number;
      source: 'real' | 'fallback';
      occurrences?: number;
    }>;
    intentAnalysis: {
      extracted: string | null;
      fallbackUsed: string | null;
      reason: string;
    };
    alignmentAnalysis: {
      realAlignment: number;
      dashboardShows: number;
      reason: string;
    };
  };
}

export function ProcessingResultsSection({ results }: ProcessingResultsProps) {
  const realThemes = results.themesDetected.filter(t => t.source === 'real');
  const fallbackThemes = results.themesDetected.filter(t => t.source === 'fallback');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <TestTube className="h-5 w-5 mr-2 text-gray-500" />
          Processing Results
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          How AI actually processes your content
        </p>
      </div>

      {/* Themes Analysis */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <BarChart className="h-4 w-4 mr-2" />
          Theme Detection
        </h3>
        
        {realThemes.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 mb-2">Detected from your content:</div>
            {realThemes.map((theme, index) => (
              <div key={index} className="flex items-center">
                <span className="text-sm text-gray-700 w-32">{theme.name}</span>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${theme.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-600 w-24 text-right">
                  {Math.round(theme.confidence * 100)}% confidence
                </div>
                {theme.occurrences && (
                  <div className="ml-2 text-xs text-gray-500">
                    ({theme.occurrences}x)
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ No themes detected from actual content
            </p>
          </div>
        )}

        {fallbackThemes.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xs font-medium text-red-800 mb-2">Hardcoded fallbacks added:</div>
            <div className="space-y-1">
              {fallbackThemes.map((theme, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {theme.name} (fake theme)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Intent Analysis */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          Intent Detection
        </h3>
        
        <div className="space-y-3">
          {results.intentAnalysis.extracted ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs font-medium text-green-800 mb-1">Extracted Intent:</div>
              <div className="text-sm text-green-700">{results.intentAnalysis.extracted}</div>
              <div className="text-xs text-green-600 mt-2">Source: {results.intentAnalysis.reason}</div>
            </div>
          ) : results.intentAnalysis.fallbackUsed ? (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xs font-medium text-orange-800 mb-1">Using Fallback:</div>
              <div className="text-sm text-orange-700">{results.intentAnalysis.fallbackUsed}</div>
              <div className="text-xs text-orange-600 mt-2">Reason: {results.intentAnalysis.reason}</div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-700">No intent could be determined</div>
            </div>
          )}
        </div>
      </div>

      {/* Alignment Analysis */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Document Alignment Calculation</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Real Alignment</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(results.alignmentAnalysis.realAlignment * 100)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Based on content presence</div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Dashboard Shows</div>
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(results.alignmentAnalysis.dashboardShows * 100)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Based on recent updates</div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-yellow-50 rounded text-xs text-yellow-800">
          💡 {results.alignmentAnalysis.reason}
        </div>
      </div>
    </div>
  );
}