'use client';
import { useQuery } from '@tanstack/react-query';

const get = async (path:string) => {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
};

export function useBasket(id: string) {
  return useQuery({ queryKey: ['basket', id], queryFn: () => get(`/api/baskets/${id}`), staleTime: 30000 });
}
export function useBasketDeltas(id: string) {
  return useQuery({
    queryKey: ['basket', id, 'deltas'],
    queryFn: () => get(`/api/baskets/${id}/deltas`),
    refetchInterval: 3000,
    select: (rows: any[]) => rows?.sort((a,b)=> (a.created_at < b.created_at ? 1 : -1)) ?? [],
  });
}
