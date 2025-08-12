'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBasketDeltas } from '@/hooks/useBasket';
import { useBasketOperations } from '@/hooks/useBasketOperations';
import { useFocus } from './FocusContext';
import ThinkingPartner from './ThinkingPartner';
import { toast } from 'react-hot-toast';

export default function WorkRight({ basketId }: { basketId: string }) {
  const queryClient = useQueryClient();
  const { data: deltas } = useBasketDeltas(basketId);
  const { applyDelta } = useBasketOperations(basketId);
  const { focus } = useFocus();
  const [processingDelta, setProcessingDelta] = useState<string | null>(null);
  const latest = deltas?.[0];
  
  const handleApplyDelta = async (deltaId: string) => {
    setProcessingDelta(deltaId);
    try {
      const success = await applyDelta(deltaId);
      if (success) {
        toast.success('Delta applied successfully');
        // Invalidate deltas query to trigger refetch
        await queryClient.invalidateQueries({ queryKey: ['basket', basketId, 'deltas'] });
      } else {
        toast.error('Failed to apply delta');
      }
    } catch (error) {
      toast.error('Error applying delta');
      console.error('Apply delta error:', error);
    } finally {
      setProcessingDelta(null);
    }
  };
  
  const handleReviewDelta = (deltaId: string) => {
    // TODO: Implement delta review modal/view
    toast('Review feature coming soon', { icon: '👀' });
  };
  
  const handleRejectDelta = async (deltaId: string) => {
    // TODO: Implement delta rejection API
    toast('Reject feature coming soon', { icon: '🚫' });
  };

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
              <button 
                onClick={() => handleApplyDelta(latest.delta_id)}
                disabled={processingDelta === latest.delta_id}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingDelta === latest.delta_id ? 'Applying...' : 'Apply'}
              </button>
              <button 
                onClick={() => handleReviewDelta(latest.delta_id)}
                disabled={processingDelta === latest.delta_id}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review
              </button>
              <button 
                onClick={() => handleRejectDelta(latest.delta_id)}
                disabled={processingDelta === latest.delta_id}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
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
