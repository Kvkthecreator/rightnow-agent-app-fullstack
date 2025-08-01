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

function getFallbackGuidance(): StrategicGuidance[] {
  return [
    {
      title: "Strategic Documentation",
      description: "Your project would benefit from clearer strategic documentation",
      recommendation: "Create a comprehensive strategy document that outlines your project's core objectives and approach",
      reasoning: "I notice you have several document fragments but no central strategic overview",
      action_plan: [
        {
          step: "Strategic Overview Draft",
          description: "Create initial strategy document structure",
          user_benefit: "Clear project direction",
          estimated_time: "2-3 hours"
        }
      ],
      expected_outcome: "Improved project clarity and stakeholder alignment",
      timeframe: "short_term",
      difficulty: "beginner_friendly"
    }
  ];
}

export function useIntelligentGuidance(
  basketId: string, 
  focusArea?: string, 
  userGoal?: string
) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<StrategicGuidance[]>(
    basketId && user ? 
      `/api/narrative-intelligence/intelligent-guidance?basket_id=${basketId}&workspace_id=default` : 
      null,
    async (url: string) => {
      try {
        const response = await fetchWithToken(url);
        
        if (!response.ok) {
          console.warn(`Guidance API error: ${response.status}`);
          return getFallbackGuidance();
        }
        
        const result: IntelligentGuidanceResponse = await response.json();
        return result.guidance || getFallbackGuidance();
      } catch (err) {
        console.warn('Guidance API fetch failed:', err);
        return getFallbackGuidance();
      }
    },
    {
      refreshInterval: 120000, // 2 minute refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
      dedupingInterval: 60000,
      shouldRetryOnError: false
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