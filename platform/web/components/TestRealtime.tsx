"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

interface TestRealtimeProps {
  basketId: string;
}

export function TestRealtime({ basketId }: TestRealtimeProps) {
  const [status, setStatus] = useState('');
  const [changes, setChanges] = useState<any[]>([]);
  const [lastChange, setLastChange] = useState<string>('');

  useEffect(() => {
    const supabase = createBrowserClient();
    
    console.log('Testing realtime for basket:', basketId);
    
    const channel = supabase
      .channel('test_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `basket_id=eq.${basketId}`
        },
        (payload) => {
          console.log('Block change detected in test:', payload);
          setChanges(prev => [...prev, payload]);
          setLastChange(`Block ${payload.eventType} at ${new Date().toLocaleTimeString()}`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raw_dumps',
          filter: `basket_id=eq.${basketId}`
        },
        (payload) => {
          console.log('Raw dump change detected in test:', payload);
          setChanges(prev => [...prev, payload]);
          setLastChange(`Raw dump ${payload.eventType} at ${new Date().toLocaleTimeString()}`);
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log('Test subscription status:', subscriptionStatus);
        setStatus(subscriptionStatus);
      });

    return () => {
      console.log('Cleaning up test realtime subscription');
      channel.unsubscribe();
    };
  }, [basketId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED': return 'text-green-400';
      case 'CHANNEL_ERROR': return 'text-red-400';
      case 'TIMED_OUT': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED': return '✅';
      case 'CHANNEL_ERROR': return '❌';
      case 'TIMED_OUT': return '⏱️';
      default: return '🔄';
    }
  };

  return (
    <div className="fixed bottom-0 right-0 p-4 bg-black/90 text-white text-xs max-w-sm rounded-tl-lg shadow-lg">
      <div className="font-bold text-blue-400 mb-2">Realtime Test</div>
      
      <div className="space-y-1">
        <div>
          Status: <span className={getStatusColor(status)}>
            {getStatusIcon(status)} {status || 'Connecting...'}
          </span>
        </div>
        
        <div>Basket: <span className="text-gray-300">{basketId}</span></div>
        
        <div>Changes: <span className="text-yellow-400">{changes.length}</span></div>
        
        {lastChange && (
          <div className="text-green-300 text-xs">
            Last: {lastChange}
          </div>
        )}
        
        {status === 'SUBSCRIBED' && (
          <div className="text-green-400 text-xs mt-2">
            🎉 Ready! Try adding content to see realtime updates.
          </div>
        )}
        
        {status === 'CHANNEL_ERROR' && (
          <div className="text-red-400 text-xs mt-2">
            Check console for RLS/publication errors.
          </div>
        )}
        
        {status === 'TIMED_OUT' && (
          <div className="text-yellow-400 text-xs mt-2">
            Connection timed out. Check Supabase realtime service.
          </div>
        )}
      </div>
      
      {changes.length > 0 && (
        <div className="mt-2 max-h-20 overflow-y-auto text-xs text-gray-300">
          <div className="font-semibold">Recent Changes:</div>
          {changes.slice(-3).map((change, i) => (
            <div key={i} className="truncate">
              {change.eventType} on {change.table}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}