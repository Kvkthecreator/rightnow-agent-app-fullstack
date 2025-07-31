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
    basketId && user ? `/api/narrative-intelligence/dashboard/${basketId}?workspace_id=${user?.workspace_id || 'default'}` : null,
    async (url: string) => {
      const response = await fetchWithToken(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch basket intelligence: ${response.status}`);
      }
      const result = await response.json();
      
      // Transform the new API response to match the expected interface
      if (result.success && result.dashboard) {
        const dashboard = result.dashboard;
        return {
          understanding: dashboard.understanding?.current_understanding || "Building understanding of your project...",
          themes: dashboard.understanding?.discovered_themes?.map((theme: any) => theme.name) || [],
          nextSteps: dashboard.next_steps?.immediate_steps?.map((step: any, index: number) => ({
            description: step.description,
            priority: index + 1
          })) || [],
          actions: dashboard.guidance?.slice(0, 3)?.map((guidance: any) => ({
            type: "guidance",
            label: guidance.title,
            enabled: true,
            primary: guidance.difficulty === "beginner_friendly"
          })) || [],
          confidenceScore: dashboard.understanding?.confidence?.level === "comprehensive_knowledge" ? 0.9 :
                          dashboard.understanding?.confidence?.level === "solid_grasp" ? 0.7 :
                          dashboard.understanding?.confidence?.level === "building_understanding" ? 0.5 : 0.3,
          memoryGrowth: dashboard.health?.overall_health === "excellent" ? 0.9 :
                       dashboard.health?.overall_health === "good" ? 0.7 :
                       dashboard.health?.overall_health === "developing" ? 0.5 : 0.3,
          lastUpdated: dashboard.timestamp || new Date().toISOString()
        };
      }
      
      // Fallback for unsuccessful responses
      return {
        understanding: "Add some content to help me understand your project",
        themes: [],
        nextSteps: [],
        actions: [],
        confidenceScore: 0.1,
        memoryGrowth: 0.1,
        lastUpdated: new Date().toISOString()
      };
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