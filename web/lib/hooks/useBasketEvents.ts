// web/lib/hooks/useBasketEvents.ts
import { useEffect, useState } from "react";
import { authHelper } from "@/lib/supabase/auth-helper";

export function useBasketEvents(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let channel: any = null;
    let supabaseInstance: any = null;
    
    const setupRealtime = async () => {
      try {
        // Check auth using secure helper (but don't fail if no auth)
        const user = await authHelper.getAuthenticatedUser();
        if (!user) {
          console.warn('⚠️ No authenticated user for basket events - trying with anon permissions');
        } else {
          console.log('✅ Authenticated user found:', user.id);
          
          // Verify basket access via workspace membership
          const hasAccess = await authHelper.checkBasketAccess(basketId);
          if (!hasAccess) {
            console.error('❌ No basket access for basket events');
            setStatus('error');
            return;
          }
        }

        // Get authenticated client that respects workspace membership
        const supabase = await authHelper.getAuthenticatedClient();
        if (!supabase) {
          console.error('❌ Failed to get authenticated client');
          setStatus('error');
          return;
        }
        
        // Store for cleanup
        supabaseInstance = supabase;

        // Subscribe to basket_events table for this basket with proper error handling
        console.log('[DEBUG] About to create channel subscription')
        console.log('[DEBUG] Basket ID:', basketId)
        console.log('[DEBUG] Channel name will be:', `basket-${basketId}`)
        
        // Get current session to explicitly pass token to channel if available
        const { data: { session } } = await supabase.auth.getSession()
        let channelConfig: any = {}
        
        if (session?.access_token) {
          console.log('[DEBUG] 🔧 Creating channel with explicit access token')
          channelConfig = {
            config: {
              broadcast: { self: true },
              presence: { key: session.user.id },
              params: {
                apikey: session.access_token
              }
            }
          }
          console.log('[DEBUG] ✅ Channel config with auth token set')
        } else {
          console.log('[DEBUG] ⚠️ No session token - channel will use anon key')
        }
        
        channel = supabase
          .channel(`basket-${basketId}`, channelConfig)
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
            console.log(`[DEBUG] Realtime subscription status changed: ${status}`);
            
            // Log WebSocket connection details if available
            if ((channel as any)._socket) {
              const socket = (channel as any)._socket;
              console.log('[DEBUG] WebSocket endpoint:', socket.endPoint);
              console.log('[DEBUG] WebSocket params:', socket.params);
              console.log('[DEBUG] WebSocket state:', socket.readyState);
            }
            
            if (status === 'SUBSCRIBED') {
              setStatus('connected');
              console.log('✅ Successfully subscribed to basket events');
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('error');
              console.error('❌ Channel error - check browser console for details');
              if (err) {
                console.error('Channel error details:', err);
              }
              
              // Additional debugging for channel errors
              console.error('[DEBUG] Channel error - full details:', {
                status,
                error: err,
                channel: channel,
                basketId
              });
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
      if (channel && supabaseInstance) {
        console.log(`📡 Cleaning up realtime subscription for basket ${basketId}`);
        supabaseInstance.removeChannel(channel);
      }
    };
  }, [basketId]);

  return { lastEvent, status };
}