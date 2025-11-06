'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

/**
 * Hook to get the workspace ID from the current basket
 */
export function useWorkspaceId(basketId: string): string | null {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!basketId) return;

    const fetchWorkspaceId = async () => {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('baskets')
        .select('workspace_id')
        .eq('id', basketId)
        .single();

      setWorkspaceId(data?.workspace_id || null);
    };

    fetchWorkspaceId();
  }, [basketId]);

  return workspaceId;
}