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

function getFallbackHealth(): ProjectHealthAssessment {
  return {
    overall_health: "developing",
    strengths: [
      "Active engagement with content creation",
      "Clear project workspace organization",
      "Consistent documentation patterns"
    ],
    improvement_areas: [
      "Strategic documentation could be expanded",
      "Cross-document connections need development"
    ],
    recommendations: [
      {
        focus: "Documentation",
        suggestion: "Create comprehensive strategic overview document",
        impact: "high",
        effort: "medium"
      },
      {
        focus: "Organization",
        suggestion: "Establish consistent document templates",
        impact: "medium",
        effort: "low"
      }
    ],
    progress_trajectory: "positive"
  };
}

export function useProjectHealth(basketId: string, previousAnalysis?: Record<string, any>) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ProjectHealthAssessment>(
    basketId && user ? 
      `/api/narrative-intelligence/project-health?basket_id=${basketId}&workspace_id=default` : 
      null,
    async (url: string) => {
      try {
        const response = await fetchWithToken(url);
        
        if (!response.ok) {
          console.warn(`Health API error: ${response.status}`);
          return getFallbackHealth();
        }
        
        const result: ProjectHealthResponse = await response.json();
        return result.health_assessment || getFallbackHealth();
      } catch (err) {
        console.warn('Health API fetch failed:', err);
        return getFallbackHealth();
      }
    },
    {
      refreshInterval: 300000, // 5 minute refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
      dedupingInterval: 120000,
      shouldRetryOnError: false
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