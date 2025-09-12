"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { BasketStats, BasketMaturity } from '@/lib/basket/maturity';
import { getMaturityGuidance } from '@/lib/basket/maturity';

interface BasketStatsResponse {
  stats: BasketStats;
  maturity: BasketMaturity;
  basket_id: string;
}

interface UseBasketMaturityReturn {
  stats: BasketStats | null;
  maturity: BasketMaturity | null;
  guidance: ReturnType<typeof getMaturityGuidance> | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing basket maturity data and adaptive guidance
 * Provides real-time substrate statistics and maturity calculations
 */
export function useBasketMaturity(basketId: string): UseBasketMaturityReturn {
  const [stats, setStats] = useState<BasketStats | null>(null);
  const [maturity, setMaturity] = useState<BasketMaturity | null>(null);
  const [guidance, setGuidance] = useState<ReturnType<typeof getMaturityGuidance> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaturity = useCallback(async () => {
    if (!basketId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/baskets/${basketId}/stats`;
      const response = await fetchWithToken(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch basket stats: ${response.statusText}`);
      }

      const data: BasketStatsResponse = await response.json();
      
      setStats(data.stats);
      setMaturity(data.maturity);
      setGuidance(getMaturityGuidance(data.maturity));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load basket maturity';
      setError(errorMessage);
      console.error('Basket maturity fetch error:', err);
      
      // Set default values on error
      setStats(null);
      setMaturity(null);
      setGuidance(null);
      
    } finally {
      setIsLoading(false);
    }
  }, [basketId]);

  // Load maturity on mount and basketId changes
  useEffect(() => {
    fetchMaturity();
  }, [fetchMaturity]);

  return {
    stats,
    maturity,
    guidance,
    isLoading,
    error,
    refresh: fetchMaturity
  };
}