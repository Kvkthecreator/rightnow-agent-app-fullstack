/**
 * Hook to fetch blocks from substrate-api baskets
 * Blocks are managed by substrate-api, not work-platform
 */

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

export type BlockRow = {
  id: string;
  basket_id: string;
  type: string | null;
  label: string | null;
  content: string | null;
  commit_id: string | null;
  updated_at: string;
  created_at: string;
};

export function useBlocks(basketId: string) {
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createBrowserClient();
        const { data, error: queryError } = await supabase
          .from('blocks')
          .select('id, basket_id, type, label, content, commit_id, updated_at, created_at')
          .eq('basket_id', basketId)
          .order('updated_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }

        setBlocks(data || []);
      } catch (err) {
        console.error('❌ Failed to fetch blocks:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (basketId) {
      fetchBlocks();
    }
  }, [basketId]);

  return { blocks, isLoading, error };
}
