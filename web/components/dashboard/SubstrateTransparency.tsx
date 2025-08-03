"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubstrateDisplayProps {
  documents: number;
  rawDumps: number;
  contextItems: number;
  blocks: number;
  totalWords: number;
  patternsDetected: number;
  readinessLevel: string;
  basketId: string;
}

export function SubstrateTransparency({ 
  documents, 
  rawDumps, 
  contextItems, 
  blocks, 
  totalWords, 
  patternsDetected, 
  readinessLevel,
  basketId 
}: SubstrateDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const openDetailedView = () => {
    router.push(`/baskets/${basketId}/work/detailed-view`);
  };

  const getReadinessColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'ready for strategic document creation':
      case 'ready for insights generation':
        return 'text-green-600 bg-green-50';
      case 'ready for pattern detection':
      case 'building understanding':
        return 'text-blue-600 bg-blue-50';
      case 'needs more content':
      case 'getting started':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h2 className="text-sm font-medium text-gray-900">What I'm Working With</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        
        <button
          onClick={openDetailedView}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>Detailed view</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Compact Summary */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            📝 <span className="font-medium">{documents}</span> thinking spaces
          </span>
          <span className="flex items-center gap-1">
            🗂️ <span className="font-medium">{contextItems}</span> context threads
          </span>
          <span className="flex items-center gap-1">
            🧩 <span className="font-medium">{blocks}</span> structured insights
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              🎯 <span className="font-medium">{formatNumber(totalWords)}</span> words analyzed
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">{patternsDetected}</span> meaningful patterns detected
            </span>
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getReadinessColor(readinessLevel)}`}>
            💡 {readinessLevel}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{documents}</div>
              <div className="text-xs text-gray-600 mt-1">Documents</div>
              <div className="text-xs text-gray-500">Active thinking spaces</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-green-600">{rawDumps}</div>
              <div className="text-xs text-gray-600 mt-1">Raw Dumps</div>
              <div className="text-xs text-gray-500">Processed content</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-purple-600">{contextItems}</div>
              <div className="text-xs text-gray-600 mt-1">Context Items</div>
              <div className="text-xs text-gray-500">Reference threads</div>
            </div>
            
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{blocks}</div>
              <div className="text-xs text-gray-600 mt-1">Blocks</div>
              <div className="text-xs text-gray-500">Structured insights</div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800 font-medium">Analysis Depth:</span>
              <span className="text-blue-700">{formatNumber(totalWords)} words • {patternsDetected} patterns</span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              Your substrate contains substantial content for generating insights and strategic documents.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}