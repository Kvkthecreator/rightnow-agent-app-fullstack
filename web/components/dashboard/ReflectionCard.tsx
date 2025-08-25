"use client";

import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '@/components/ui/Button';

dayjs.extend(relativeTime);

interface ReflectionCardProps {
  basketId: string;
  reflection?: {
    id: string;
    reflection_text: string;
    computation_timestamp: string;
  } | null;
}

export default function ReflectionCard({ basketId, reflection }: ReflectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger reflection refresh via GET with refresh=1
      const response = await fetch(`/api/baskets/${basketId}/reflections?refresh=1`);
      if (response.ok) {
        // Reload page to show updated reflection
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh reflection:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const truncateText = (text: string, maxLines: number = 4) => {
    const words = text.split(' ');
    const wordsPerLine = 12; // Approximate
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  };

  if (!reflection) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Reflection</h3>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? 'Generating...' : 'Generate Insights'}
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🤔</div>
          <p className="text-gray-600 text-sm">
            No reflection yet. Add some memories first, then generate insights.
          </p>
        </div>
      </div>
    );
  }

  const displayText = isExpanded 
    ? reflection.reflection_text 
    : truncateText(reflection.reflection_text);
  const needsExpansion = reflection.reflection_text.length > truncateText(reflection.reflection_text).length;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Reflection</h3>
          <span className="text-xs text-gray-500">
            {dayjs(reflection.computation_timestamp).fromNow()}
          </span>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Insights'}
        </Button>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
          {displayText}
        </p>
        {needsExpansion && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
          >
            Expand
          </button>
        )}
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
          >
            Collapse
          </button>
        )}
      </div>
    </div>
  );
}