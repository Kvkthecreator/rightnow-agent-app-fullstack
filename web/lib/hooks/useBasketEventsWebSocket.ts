import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

// Create supabase client once per module
const supabase = createBrowserClient();

export function useBasketEventsWebSocket(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const channel = supabase
      .channel(`basket-${basketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'basket_events', filter: `payload->>basket_id=eq.${basketId}` }, (payload) => {
        const eventData = payload.new as any;
        setLastEvent({ type: eventData.event_type, payload: eventData.payload });
      })
      .subscribe((v, err) => {
        if (v === 'SUBSCRIBED') setStatus('connected');
        if (v === 'CHANNEL_ERROR' || err) setStatus('error');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [basketId]);

  return { lastEvent, status };
}
