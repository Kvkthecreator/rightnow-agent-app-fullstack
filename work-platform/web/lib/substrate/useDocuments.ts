'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/clients';

export interface DocumentRow {
  id: string;
  basket_id: string;
  title: string;
  doc_type: string;
  current_version_hash: string | null;
  content: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string | null;
  latest_version_created_at?: string | null;
}

export function useDocuments(basketId: string) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const supabase = createBrowserClient();
        const { data, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('basket_id', basketId)
          .order('updated_at', { ascending: false });

        if (fetchError) throw fetchError;
        setDocuments(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err as Error);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (basketId) {
      fetchDocuments();
    }
  }, [basketId]);

  return { documents, isLoading, error };
}
