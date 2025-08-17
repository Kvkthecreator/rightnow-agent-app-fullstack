/**
 * Polling-based basket events hook
 * 
 * PRAGMATIC SOLUTION: Due to Supabase WebSocket authentication SDK issues,
 * we're using polling as a reliable alternative. This provides the same
 * interface as useBasketEvents but polls every 3 seconds instead of using
 * WebSocket connections.
 * 
 * UX Impact: 3-second delay is imperceptible to users
 * Technical Debt: WebSocket code preserved for future implementation
 */

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

// Create supabase client once per module
const supabase = createBrowserClient();

export function useBasketPolling(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!basketId) {
      setStatus('error');
      return;
    }

    console.log(`📊 Starting polling for basket events: ${basketId}`);

    const pollEvents = async () => {
      try {
        // Query for recent events for this basket
        const { data, error } = await supabase
          .from('basket_events')
          .select('*')
          .eq('payload->>basket_id', basketId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('📊 Polling error:', error.message);
          setStatus('error');
          return;
        }

        // Mark as connected after successful poll
        if (status !== 'connected') {
          setStatus('connected');
          console.log(`📊 Polling connected for basket: ${basketId}`);
        }

        if (data && data.length > 0) {
          const latestEvent = data[0];
          
          // Check if this is a new event we haven't seen
          if (latestEvent.id !== lastEventIdRef.current) {
            lastEventIdRef.current = latestEvent.id;
            
            setLastEvent({
              type: latestEvent.event_type,
              payload: latestEvent.payload
            });
            
            console.log('📊 New event detected via polling:', {
              id: latestEvent.id,
              type: latestEvent.event_type,
              basketId: basketId
            });
          }
        }

      } catch (err) {
        console.error('📊 Polling failed:', err);
        setStatus('error');
      }
    };

    // Initial poll to get current state
    pollEvents();

    // Set up polling interval (3 seconds)
    const interval = setInterval(pollEvents, 3000);

    console.log(`📊 Polling interval started (3s) for basket: ${basketId}`);

    // Cleanup function
    return () => {
      clearInterval(interval);
      console.log(`📊 Polling stopped for basket: ${basketId}`);
    };
  }, [basketId, status]);

  return { 
    lastEvent, 
    status,
    // Additional metadata for debugging
    _pollingInfo: {
      isPolling: true,
      interval: '3 seconds',
      basketId: basketId
    }
  };
}

/**
 * Alternative hook name for drop-in replacement
 * This allows easy switching between polling and WebSocket versions
 */
export const useBasketEvents = useBasketPolling;