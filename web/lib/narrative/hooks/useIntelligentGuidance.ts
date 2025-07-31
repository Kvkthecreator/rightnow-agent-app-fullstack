"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface ActionStep {
  step: string;
  description: string;
  user_benefit: string;
  estimated_time: string;
  prerequisite?: string;
}

interface StrategicGuidance {
  title: string;
  description: string;
  recommendation: string;
  reasoning: string;
  action_plan: ActionStep[];
  expected_outcome: string;
  timeframe: string;
  difficulty: string;
}

interface IntelligentGuidanceResponse {
  success: boolean;
  guidance?: StrategicGuidance[];
  error?: string;
}

export function useIntelligentGuidance(
  basketId: string, 
  focusArea?: string, 
  userGoal?: string
) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<StrategicGuidance[]>(
    basketId && user ? ['intelligent-guidance', basketId, focusArea, userGoal] : null,
    async () => {
      const response = await fetchWithToken('/api/narrative-intelligence/intelligent-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basket_id: basketId,
          workspace_id: user?.workspace_id || 'default',
          focus_area: focusArea,
          user_goal: userGoal
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch intelligent guidance: ${response.status}`);
      }

      const result: IntelligentGuidanceResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get intelligent guidance');
      }

      return result.guidance || [];
    },
    {
      refreshInterval: 120000, // 2 minute refresh
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 60000
    }
  );

  return {
    guidance: data || [],
    error,
    isLoading,
    mutate,
    refresh: () => mutate()
  };
}