import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useBasketEvents(basketId: string) {
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any } | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);
    const channel = supabase
      .channel(`basket-${basketId}`)
      .on("broadcast", { event: "basket.delta.proposed" }, (payload) =>
        setLastEvent({ type: "proposed", payload })
      )
      .on("broadcast", { event: "basket.delta.applied" }, (payload) =>
        setLastEvent({ type: "applied", payload })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [basketId]);
  return lastEvent;
}
