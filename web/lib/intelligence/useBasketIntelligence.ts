"use client";

/**
 * @deprecated Use useUnifiedIntelligence instead. This hook will be removed in a future version.
 * useUnifiedIntelligence provides better state management, unified API calls, and modal integration.
 */

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface ThematicAnalysis {
  analysis_id: string;
  dominant_themes: string[];
  theme_distribution: Record<string, number>;
  discovered_patterns: {
    pattern_id: string;
    theme_name: string;
    pattern_strength: "weak" | "moderate" | "strong";
    confidence: number;
  }[];
}

interface DocumentRelationships {
  analysis_id: string;
  document_pairs: {
    relationship_id: string;
    document_a_id: string;
    document_b_id: string;
    relationship_type: string;
    strength: number;
    relationship_description: string;
    potential_value: "low" | "medium" | "high";
  }[];
  suggested_connections: string[];
}

interface CoherenceSuggestions {
  analysis_id: string;
  suggestions: {
    suggestion_id: string;
    suggestion_type: string;
    priority: "low" | "medium" | "high";
    description: string;
    reasoning: string;
    suggested_action: string;
    expected_benefit: string;
    effort_estimate: string;
    user_choice_emphasis: string;
  }[];
  accommodation_note: string;
}

interface BasketIntelligence {
  basket_id: string;
  analysis_timestamp: string;
  thematic_analysis: ThematicAnalysis;
  document_relationships: DocumentRelationships;
  coherence_suggestions: CoherenceSuggestions;
  status: "analyzing" | "complete" | "error";
}

export function useBasketIntelligence(basketId: string, refreshInterval: number = 5000) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<BasketIntelligence>(
    basketId && user ? `/api/intelligence/basket/${basketId}/comprehensive` : null,
    async (url: string) => {
      const response = await fetchWithToken(url);
      if (!response.ok) {
        throw new Error('Failed to fetch basket intelligence');
      }
      return response.json();
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 1000
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