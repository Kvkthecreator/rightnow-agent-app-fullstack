"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface ProjectUnderstanding {
  personalized_greeting: string;
  current_understanding: string;
  intelligence_level: {
    stage: string;
    description: string;
    progress_indicator: string;
    capabilities: string[];
  };
  confidence: {
    level: string;
    explanation: string;
    visual_description: string;
  };
  discovered_themes: Array<{
    name: string;
    description: string;
    relevance: string;
    user_friendly_explanation: string;
  }>;
  next_steps: string[];
  recommended_actions: string[];
}

interface ProjectUnderstandingResponse {
  success: boolean;
  understanding?: ProjectUnderstanding;
  error?: string;
}

export function useProjectUnderstanding(basketId: string, userContext?: Record<string, string>) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ProjectUnderstanding>(
    basketId && user ? ['project-understanding', basketId, userContext] : null,
    async () => {
      const response = await fetchWithToken('/api/narrative-intelligence/project-understanding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basket_id: basketId,
          workspace_id: 'default',
          user_context: userContext
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch project understanding: ${response.status}`);
      }

      const result: ProjectUnderstandingResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get project understanding');
      }

      return result.understanding!;
    },
    {
      refreshInterval: 60000, // 1 minute refresh
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 30000
    }
  );

  return {
    understanding: data,
    error,
    isLoading,
    mutate,
    refresh: () => mutate()
  };
}