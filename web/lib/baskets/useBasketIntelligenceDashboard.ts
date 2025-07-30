"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface NextStep {
  description: string;
  priority: number;
}

interface Action {
  type: string;
  label: string;
  enabled: boolean;
  primary?: boolean;
}

interface BasketIntelligenceDashboard {
  understanding: string;
  themes: string[];
  nextSteps: NextStep[];
  actions: Action[];
  confidenceScore: number;
  memoryGrowth: number;
  lastUpdated: string;
}

export function useBasketIntelligenceDashboard(basketId: string) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<BasketIntelligenceDashboard>(
    basketId && user ? `/api/intelligence/basket/${basketId}/dashboard` : null,
    async (url: string) => {
      const response = await fetchWithToken(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch basket intelligence: ${response.status}`);
      }
      return response.json();
    },
    {
      refreshInterval: 30000, // 30 second refresh for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 10000
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    refresh: () => mutate()
  };
}