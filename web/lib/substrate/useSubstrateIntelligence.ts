"use client";

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { SubstrateIntelligence, SubstrateContentInput, AddContextResult } from './types';

interface UseSubstrateIntelligenceReturn {
  intelligence: SubstrateIntelligence | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addContext: (content: SubstrateContentInput[]) => Promise<AddContextResult | null>;
}

export function useSubstrateIntelligence(basketId: string): UseSubstrateIntelligenceReturn {
  const [intelligence, setIntelligence] = useState<SubstrateIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchWithToken(`/api/substrate/basket/${basketId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch substrate intelligence: ${response.status}`);
      }
      
      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Substrate intelligence fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchIntelligence();
  };

  const addContext = async (content: SubstrateContentInput[]): Promise<AddContextResult | null> => {
    try {
      setLoading(true);
      
      // Process content through universal processors and create raw_dump
      const response = await fetchWithToken('/api/substrate/add-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId,
          content,
          triggerIntelligenceRefresh: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add context: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Smart refresh: wait for processing to complete, then refresh intelligence
      if (result.processingResults?.contentProcessed > 0) {
        // Wait a moment for backend processing to complete
        setTimeout(async () => {
          await fetchIntelligence();
        }, 2000);
      } else {
        await fetchIntelligence();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add context');
      console.error('Add context error:', err);
      return null;
    }
  };

  useEffect(() => {
    if (basketId) {
      fetchIntelligence();
    }
  }, [basketId]);

  return {
    intelligence,
    loading,
    error,
    refresh,
    addContext
  };
}