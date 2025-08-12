'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { basketApi } from '@/lib/api/client';
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
    queryFn: () => basketApi.get(id),
    staleTime: 30000,
  });
}

export function useBasketDeltas(id: string) {
  useBasketSync(id);
  return useQuery({
    queryKey: ['basket', id, 'deltas'],
    queryFn: () => basketApi.getDeltas(id),
    select: (rows: any[]) => rows?.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)) ?? [],
  });
}
