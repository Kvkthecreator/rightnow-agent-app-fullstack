import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

export function useBasketEvents(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient>>();

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabaseRef.current = supabase;

    // Subscribe to basket_events table for this basket
    const channel = supabase
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
          const eventData = payload.new as any;
          setLastEvent({
            type: eventData.event_type,
            payload: eventData.payload,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [basketId]);

  return lastEvent;
}
