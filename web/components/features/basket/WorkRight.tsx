'use client';
import { useBasketDeltas } from '@/hooks/useBasket';
import { useFocus } from './FocusContext';
import ThinkingPartner from './ThinkingPartner';

export default function WorkRight({ basketId }: { basketId: string }) {
  const { data: deltas } = useBasketDeltas(basketId);
  const { focus } = useFocus();
  const latest = deltas?.[0];

  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Intelligence</h2>
        {focus.kind !== 'dashboard' && (
          <div className="text-xs text-gray-600 mt-1">
            Focused on {focus.kind}
            {(focus.kind === 'document' || focus.kind === 'block') && focus.id && ` ${focus.id.slice(0, 8)}...`}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <ThinkingPartner basketId={basketId} />
        
        {/* Change Review */}
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
              <button className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors">
                Apply
              </button>
              <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                Review
              </button>
              <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                Reject
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
      </div>
    </aside>
  );
}
