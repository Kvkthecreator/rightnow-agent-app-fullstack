'use client';
import { useBasket, useBasketDeltas } from '@/hooks/useBasket';
import { useBasketEvents } from '@/lib/hooks/useBasketEvents';
import { LoadingSkeleton } from '@/components/ui/states';


export default function DashboardCenter({ basketId }: { basketId: string }) {
  const { data: basket, isLoading, error: basketError } = useBasket(basketId);
  const { data: allDeltas, error: deltasError } = useBasketDeltas(basketId);
  const recentDeltas = allDeltas?.slice(0, 3);
  
  // Subscribe to real-time events for this basket
  useBasketEvents(basketId);
  
  if (isLoading) return <LoadingSkeleton type="dashboard" />;
  
  // Handle API connection errors gracefully
  if (basketError || deltasError) {
    return (
      <div className="flex flex-col h-full p-8 items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Issue</h3>
        <p className="text-sm text-gray-500 mb-4">Unable to load basket data. The API may be temporarily unavailable.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Premium: Single most important metric - Memory Density
  const memoryDensity = (basket?.blocks ?? 0);
  const totalCaptures = (basket?.raw_dumps ?? 0);
  const structuredThoughts = (basket?.blocks ?? 0);
  const expressedDocs = (basket?.documents ?? 0);
  
  return (
    <div className="flex flex-col h-full p-8 space-y-8">
      {/* Hero Metric - Premium single focus */}
      <div className="p-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Memory Density</p>
        <div className="text-6xl font-light text-gray-900 mb-2">{memoryDensity}</div>
        <p className="text-sm text-gray-600">Structured thoughts captured</p>
        
        {/* Secondary metrics - minimal */}
        <div className="flex gap-8 mt-8 pt-8 border-t border-gray-100">
          <div>
            <div className="text-lg font-medium text-gray-900">{totalCaptures}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Captures</div>
          </div>
          <div>
            <div className="text-lg font-medium text-gray-900">{expressedDocs}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Documents</div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity - Minimal and focused */}
      <div className="flex-1">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-6 font-medium">
          Recent Changes
        </h3>
        
        {!recentDeltas?.length ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500">Awaiting your first thoughts...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentDeltas.map((delta: any) => (
              <div key={delta.delta_id} className="group py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {delta.summary ?? 'Untitled change'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(delta.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
