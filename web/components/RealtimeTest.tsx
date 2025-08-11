'use client';

import { useEffect, useState } from 'react';
import { authHelper } from '@/lib/supabase/auth-helper';

interface RealtimeTestProps {
  basketId: string;
}

export function RealtimeTest({ basketId }: RealtimeTestProps) {
  const [status, setStatus] = useState('CONNECTING');
  const [changes, setChanges] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;

    const setupRealtime = async () => {
      try {
        // Check auth using secure helper
        const user = await authHelper.getAuthenticatedUser();
        if (!user) {
          setError('Not authenticated');
          return;
        }

        // Verify basket access via workspace membership
        const hasAccess = await authHelper.checkBasketAccess(basketId);
        if (!hasAccess) {
          setError('No basket access');
          return;
        }

        // Get authenticated client
        const supabase = await authHelper.getAuthenticatedClient();
        if (!supabase) {
          setError('Failed to get authenticated client');
          return;
        }
        
        // Simple subscription to test
        console.log('[DEBUG REALTIME TEST] About to create test channel');
        console.log('[DEBUG REALTIME TEST] Basket ID:', basketId);
        
        channel = supabase
          .channel(`test-${basketId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'blocks',
              filter: `basket_id=eq.${basketId}`
            },
            () => {
              console.log('[DEBUG REALTIME TEST] Received blocks change');
              setChanges(prev => prev + 1);
            }
          )
          .subscribe((status) => {
            console.log('[DEBUG REALTIME TEST] Subscription status:', status);
            setStatus(status);
            
            // Log WebSocket connection details
            if ((channel as any)._socket) {
              const socket = (channel as any)._socket;
              console.log('[DEBUG REALTIME TEST] WebSocket endpoint:', socket.endPoint);
              console.log('[DEBUG REALTIME TEST] WebSocket params:', socket.params);
            }
            
            if (status === 'CHANNEL_ERROR') {
              setError('Channel error - check RLS policies');
              console.error('[DEBUG REALTIME TEST] Channel error occurred');
            } else if (status === 'TIMED_OUT') {
              setError('Connection timeout');
              console.error('[DEBUG REALTIME TEST] Connection timeout');
            } else if (status === 'SUBSCRIBED') {
              setError(null);
              console.log('[DEBUG REALTIME TEST] Successfully subscribed');
            }
          });
      } catch (err) {
        console.error('Realtime setup error:', err);
        setError(String(err));
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [basketId]);

  const statusColor = status === 'SUBSCRIBED' ? 'green' : 
                     status === 'CHANNEL_ERROR' ? 'red' : 'yellow';

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h3 className="font-bold mb-2">Realtime Test</h3>
      <div className="text-sm space-y-1">
        <div>Status: <span style={{ color: statusColor }}>● {status}</span></div>
        <div>Basket: {basketId.slice(0, 8)}...</div>
        <div>Changes: {changes}</div>
        {error && <div className="text-red-400">Error: {error}</div>}
      </div>
    </div>
  );
}