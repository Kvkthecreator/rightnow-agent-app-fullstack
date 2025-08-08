'use client';

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabaseClient';

export function useProposedBlocksCount(basketId: string) {
  const [data, setData] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    if (!basketId) {
      setData(0);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();
      const { count, error } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('basket_id', basketId)
        .eq('state', 'PROPOSED');
      
      if (error) {
        console.error('Error fetching proposed blocks count:', error);
        setError(error.message);
        setData(0);
      } else {
        setData(count || 0);
        setError(null);
      }
    } catch (error) {
      console.error('Failed to fetch proposed blocks count:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setData(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, [basketId]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCount
  };
}