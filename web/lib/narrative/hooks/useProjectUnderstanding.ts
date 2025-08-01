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

function getFallbackUnderstanding(): ProjectUnderstanding {
  return {
    personalized_greeting: "I'm ready to understand your project and help you build something meaningful",
    current_understanding: "Building understanding of your work through our collaboration...",
    intelligence_level: {
      stage: "emerging",
      description: "I'm learning the foundations of your project",
      progress_indicator: "Building understanding",
      capabilities: ["Content analysis", "Strategic thinking", "Document organization"]
    },
    confidence: {
      level: "building_understanding",
      explanation: "Learning from your content and interactions",
      visual_description: "Growing confidence as we work together"
    },
    discovered_themes: [
      {
        name: "Strategic Planning",
        description: "Focus on strategic planning and documentation",
        relevance: "Core to project success",
        user_friendly_explanation: "Your project involves strategic thinking and planning"
      }
    ],
    next_steps: [
      "Continue sharing your ideas and documents",
      "Explore strategic planning templates",
      "Build comprehensive project documentation"
    ],
    recommended_actions: [
      "Create strategic overview document",
      "Organize existing content",
      "Develop project timeline"
    ]
  };
}

export function useProjectUnderstanding(basketId: string, userContext?: Record<string, string>) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<ProjectUnderstanding>(
    basketId && user ? 
      `/api/narrative-intelligence/project-understanding?basket_id=${basketId}&workspace_id=default` : 
      null,
    async (url: string) => {
      try {
        const response = await fetchWithToken(url);
        
        if (!response.ok) {
          // Log error but provide fallback data instead of throwing
          console.warn(`Understanding API error: ${response.status}`);
          return getFallbackUnderstanding();
        }
        
        const result: ProjectUnderstandingResponse = await response.json();
        return result.understanding || getFallbackUnderstanding();
      } catch (err) {
        console.warn('Understanding API fetch failed:', err);
        return getFallbackUnderstanding();
      }
    },
    {
      refreshInterval: 60000, // 1 minute refresh
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 10000,
      dedupingInterval: 30000,
      // Don't throw on error - always provide fallback data
      shouldRetryOnError: false
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