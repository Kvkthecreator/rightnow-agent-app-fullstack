'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBasketDeltas } from '@/hooks/useBasket';
import { useBasketOperations } from '@/hooks/useBasketOperations';
import { useFocus } from './FocusContext';
import { getSuggestions } from '@/lib/api/suggestions';
import { invalidateBasketScopes } from '@/lib/query/invalidate';
import { toast } from 'react-hot-toast';

interface RailState {
  status: 'loading' | 'live' | 'cached' | 'error';
  retryDelay: number;
  lastUpdate: Date | null;
}

export default function WorkRightResilient({ basketId }: { basketId: string }) {
  const queryClient = useQueryClient();
  const { data: deltas } = useBasketDeltas(basketId);
  const { applyDelta } = useBasketOperations(basketId);
  const { focus } = useFocus();
  
  const [processingDelta, setProcessingDelta] = useState<string | null>(null);
  const [railState, setRailState] = useState<RailState>({
    status: 'loading',
    retryDelay: 1000,
    lastUpdate: null,
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const latest = deltas?.[0];

  // Resilient suggestions query with caching and retry logic
  const {
    data: suggestions = [],
    error: suggestionsError,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: ['suggestions', basketId],
    queryFn: () => getSuggestions(basketId),
    staleTime: 60_000, // Cache for 1 minute
    retry: (failureCount, error) => {
      // Exponential backoff retry with cap
      if (failureCount >= 3) return false;
      
      const delay = Math.min(1000 * Math.pow(2, failureCount), 30000);
      setRailState(prev => ({ ...prev, retryDelay: delay }));
      
      // Don't retry for certain errors
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      
      return true;
    },
  });

  // Handle success state
  useEffect(() => {
    if (isSuccess) {
      setRailState(prev => ({
        ...prev,
        status: 'live',
        retryDelay: 1000,
        lastUpdate: new Date(),
      }));
    }
  }, [isSuccess]);

  // Handle error state
  useEffect(() => {
    if (isError && suggestionsError) {
      console.debug('[rail] Suggestions error:', suggestionsError);
      setRailState(prev => ({
        ...prev,
        status: prev.lastUpdate ? 'cached' : 'error',
      }));
    }
  }, [isError, suggestionsError]);

  // Auto-retry logic for failed suggestions
  useEffect(() => {
    if (railState.status === 'error' && railState.retryDelay < 30000) {
      retryTimeoutRef.current = setTimeout(() => {
        console.debug('[rail] Retrying suggestions fetch');
        refetchSuggestions();
      }, railState.retryDelay);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [railState.status, railState.retryDelay, refetchSuggestions]);

  const handleApplyDelta = async (deltaId: string) => {
    // Never block center content - this operates independently
    setProcessingDelta(deltaId);
    try {
      const success = await applyDelta(deltaId);
      if (success) {
        // Use centralized invalidation
        await invalidateBasketScopes(queryClient, basketId, ['deltas', 'basket']);
      }
    } catch (error) {
      console.debug('[rail] Apply delta error:', error);
      // Show local error state, don't throw global toasts
    } finally {
      setProcessingDelta(null);
    }
  };

  const handleSuggestionClick = async (intent: string) => {
    try {
      // Use basket operations for mutation
      // This will handle errors gracefully without blocking UI
      console.debug('[rail] Executing suggestion:', intent);
    } catch (error) {
      console.debug('[rail] Suggestion error:', error);
      // Local error handling only
    }
  };

  // Status indicator for rail health
  const StatusIndicator = () => {
    switch (railState.status) {
      case 'loading':
        return (
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
            Loading
          </div>
        );
      case 'live':
        return (
          <div className="flex items-center text-xs text-green-600">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Live
          </div>
        );
      case 'cached':
        return (
          <div className="flex items-center text-xs text-yellow-600">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
            Cached
            <button
              onClick={() => refetchSuggestions()}
              className="ml-2 text-blue-600 hover:text-blue-800"
              title="Retry connection"
            >
              ↻
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-xs text-red-600">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
            Reconnecting...
            <button
              onClick={() => refetchSuggestions()}
              className="ml-2 text-blue-600 hover:text-blue-800"
              title="Retry now"
            >
              ↻
            </button>
          </div>
        );
    }
  };

  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 h-full flex flex-col">
      {/* Header with status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Intelligence
          </h2>
          <StatusIndicator />
        </div>
        {focus.kind !== 'dashboard' && (
          <div className="text-xs text-gray-600 mt-1">
            Focused on {focus.kind}
            {(focus.kind === 'document' || focus.kind === 'block') && focus.id && ` ${focus.id.slice(0, 8)}...`}
          </div>
        )}
      </div>
      
      {/* Content - Never blocks center rendering */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Thinking Partner Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Thinking Partner</h3>
            {suggestionsLoading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            )}
          </div>
          
          {suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion.title)}
                  className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{suggestion.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{suggestion.description}</div>
                </button>
              ))}
            </div>
          ) : railState.status === 'error' ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500 mb-2">
                Unable to load suggestions
              </div>
              <button
                onClick={() => refetchSuggestions()}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">
                {suggestionsLoading ? 'Loading suggestions...' : 'No suggestions available'}
              </div>
            </div>
          )}
        </div>

        {/* Change Review Section */}
        {latest ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Recent Change</h3>
              <span className="text-xs text-gray-500">
                {new Date(latest.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{latest.summary ?? 'Proposed update'}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleApplyDelta(latest.delta_id)}
                disabled={processingDelta === latest.delta_id}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingDelta === latest.delta_id ? 'Applying...' : 'Apply'}
              </button>
              <button 
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-center">
              No recent changes
            </p>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 border-t pt-2">
            <div>Status: {railState.status}</div>
            {railState.lastUpdate && (
              <div>Last update: {railState.lastUpdate.toLocaleTimeString()}</div>
            )}
            <div>Suggestions: {suggestions.length}</div>
          </div>
        )}
      </div>
    </aside>
  );
}