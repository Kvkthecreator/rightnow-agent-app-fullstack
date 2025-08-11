// web/lib/hooks/useBasketEvents.ts
import { useEffect, useState } from "react";
import { authHelper } from "@/lib/supabase/auth-helper";

export function useBasketEvents(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let channel: any = null;
    
    const setupRealtime = async () => {
      try {
        // Check auth using secure helper
        const user = await authHelper.getAuthenticatedUser();
        if (!user) {
          console.error('❌ No authenticated user for basket events');
          setStatus('error');
          return;
        }

        // Verify basket access via workspace membership
        const hasAccess = await authHelper.checkBasketAccess(basketId);
        if (!hasAccess) {
          console.error('❌ No basket access for basket events');
          setStatus('error');
          return;
        }

        // Get authenticated client that respects workspace membership
        const supabase = authHelper.getAuthenticatedClient();

        // Subscribe to basket_events table for this basket with proper error handling
        channel = supabase
          .channel(`basket-${basketId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "basket_events",
              filter: `payload->>basket_id=eq.${basketId}`,
            },
            (payload) => {
              console.log('📡 Realtime basket event received:', payload);
              const eventData = payload.new as any;
              setLastEvent({
                type: eventData.event_type,
                payload: eventData.payload,
              });
              setStatus('connected');
            }
          )
          .subscribe((status, err) => {
            console.log(`📡 Realtime status for basket ${basketId}:`, status);
            if (status === 'SUBSCRIBED') {
              setStatus('connected');
              console.log('✅ Successfully subscribed to basket events');
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('error');
              console.error('❌ Channel error - check browser console for details');
              if (err) {
                console.error('Channel error details:', err);
              }
            } else if (status === 'TIMED_OUT') {
              setStatus('error');
              console.error('❌ Channel subscription timed out');
            } else if (status === 'CLOSED') {
              console.log('📡 Channel closed');
            }
          });

      } catch (error) {
        console.error('❌ Failed to setup realtime subscription:', error);
        setStatus('error');
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        console.log(`📡 Cleaning up realtime subscription for basket ${basketId}`);
        const supabase = authHelper.getAuthenticatedClient();
        supabase.removeChannel(channel);
      }
    };
  }, [basketId]);

  return { lastEvent, status };
}