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

export function useBasketIntelligenceDashboard(basketId: string, refreshInterval: number = 10000) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<BasketIntelligenceDashboard>(
    basketId && user ? `/api/intelligence/basket/${basketId}/dashboard` : null,
    async (url: string) => {
      const response = await fetchWithToken(url);
      if (!response.ok) {
        // If the API doesn't exist yet, return mock data for development
        if (response.status === 404) {
          return generateMockIntelligence(basketId);
        }
        throw new Error('Failed to fetch basket intelligence dashboard');
      }
      return response.json();
    },
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      dedupingInterval: 5000,
      fallbackData: generateMockIntelligence(basketId)
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

// Mock data generator for development/fallback
function generateMockIntelligence(basketId: string): BasketIntelligenceDashboard {
  return {
    understanding: "Based on your documents and context, I see you're working on a strategic project that involves multiple technical and planning components. The patterns suggest you're in the early discovery phase of building something significant.",
    themes: [
      "Project planning and strategy",
      "Technical implementation",
      "User experience design",
      "Business requirements"
    ],
    nextSteps: [
      {
        description: "Define your core technical architecture and key components",
        priority: 1
      },
      {
        description: "Identify and document your target user personas and use cases",
        priority: 2
      },
      {
        description: "Create a detailed project timeline with key milestones",
        priority: 3
      }
    ],
    actions: [
      {
        type: "add_content",
        label: "Add Content",
        enabled: true
      },
      {
        type: "create_document",
        label: "Create Document",
        enabled: true
      },
      {
        type: "strategic_analysis",
        label: "Ask Strategy Question",
        enabled: true
      }
    ],
    confidenceScore: 45,
    memoryGrowth: 12,
    lastUpdated: new Date().toISOString()
  };
}