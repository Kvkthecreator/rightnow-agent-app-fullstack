'use client';

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface RealtimeTestProps {
  basketId: string;
}

export function RealtimeTest({ basketId }: RealtimeTestProps) {
  const [status, setStatus] = useState('CONNECTING');
  const [changes, setChanges] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();
    let channel: any = null;

    const setupRealtime = async () => {
      try {
        // Check auth first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated');
          return;
        }

        // Simple subscription to test
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
              setChanges(prev => prev + 1);
            }
          )
          .subscribe((status) => {
            console.log('Realtime status:', status);
            setStatus(status);
            
            if (status === 'CHANNEL_ERROR') {
              setError('Channel error - check RLS policies');
            } else if (status === 'TIMED_OUT') {
              setError('Connection timeout');
            } else if (status === 'SUBSCRIBED') {
              setError(null);
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