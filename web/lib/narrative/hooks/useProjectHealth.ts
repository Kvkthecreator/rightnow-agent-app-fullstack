"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface HealthRecommendation {
  focus: string;
  suggestion: string;
  impact: string;
  effort: string;
}

interface ProjectHealthAssessment {
  overall_health: string;
  strengths: string[];
  improvement_areas: string[];
  recommendations: HealthRecommendation[];
  progress_trajectory: string;
}

interface ProjectHealthResponse {
  success: boolean;
  health_assessment?: ProjectHealthAssessment;
  error?: string;
}

export function useProjectHealth(basketId: string, previousAnalysis?: Record<string, any>) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ProjectHealthAssessment>(
    basketId && user ? ['project-health', basketId, previousAnalysis] : null,
    async () => {
      const response = await fetchWithToken('/api/narrative-intelligence/project-health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basket_id: basketId,
          workspace_id: 'default',
          previous_analysis: previousAnalysis
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch project health: ${response.status}`);
      }

      const result: ProjectHealthResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get project health assessment');
      }

      return result.health_assessment!;
    },
    {
      refreshInterval: 300000, // 5 minute refresh
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 120000
    }
  );

  return {
    health: data,
    error,
    isLoading,
    mutate,
    refresh: () => mutate()
  };
}