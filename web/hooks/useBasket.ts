'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBasket } from '@/lib/api/baskets';
import { listDeltas as getDeltasApi } from '@/lib/api/deltas';
import { useBasketEvents } from '@/lib/hooks/useBasketEvents';

function useBasketSync(id: string) {
  const queryClient = useQueryClient();
  const { lastEvent } = useBasketEvents(id);

  useEffect(() => {
    if (lastEvent) {
      queryClient.invalidateQueries({ queryKey: ['basket', id] });
      queryClient.invalidateQueries({ queryKey: ['basket', id, 'deltas'] });
    }
  }, [lastEvent, id, queryClient]);
}

export function useBasket(id: string) {
  useBasketSync(id);
  return useQuery({
    queryKey: ['basket', id],
    queryFn: () => getBasket(id),
    staleTime: 30000,
  });
}

export function useBasketDeltas(id: string) {
  useBasketSync(id);
  return useQuery({
    queryKey: ['basket', id, 'deltas'],
    queryFn: () => getDeltasApi(id),
    select: (data) => {
      const items = Array.isArray(data) ? data : data.items;
      return items?.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) ?? [];
    },
  });
}
