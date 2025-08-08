'use client';

import { useQuery } from '@tanstack/react-query';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

export function useProposedBlocksCount(basketId: string) {
  return useQuery({
    queryKey: ['proposed-blocks-count', basketId],
    queryFn: async () => {
      if (!basketId) return 0;
      
      try {
        const supabase = createClientSupabaseClient();
        const { count, error } = await supabase
          .from('blocks')
          .select('*', { count: 'exact', head: true })
          .eq('basket_id', basketId)
          .eq('state', 'PROPOSED');
        
        if (error) {
          console.error('Error fetching proposed blocks count:', error);
          return 0;
        }
        
        return count || 0;
      } catch (error) {
        console.error('Failed to fetch proposed blocks count:', error);
        return 0;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!basketId,
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
}