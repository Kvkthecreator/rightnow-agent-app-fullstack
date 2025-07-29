"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/api";

interface ForgottenInsight {
  insight_id: string;
  insight: string;
  last_seen: string;
  relevance: number;
  context: string;
  source_document_id?: string;
}

interface MemoryConnection {
  connection_id: string;
  type: "concept_bridge" | "solution_pattern" | "learning_connection" | "mistake_avoidance";
  description: string;
  confidence: number;
  timeframe: string;
  related_content: string;
}

interface PatternEvolution {
  pattern_id: string;
  theme_name: string;
  evolution_type: "emerging" | "strengthening" | "weakening" | "stable";
  confidence: number;
  timeline: string[];
}

interface MemoryInsights {
  basket_id: string;
  analysis_timestamp: string;
  forgotten_insights: ForgottenInsight[];
  memory_connections: MemoryConnection[];
  pattern_evolution: PatternEvolution[];
  status: "analyzing" | "complete" | "error";
}

export function useMemoryInsights(basketId: string, refreshInterval: number = 10000) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<MemoryInsights>(
    basketId && user ? `/api/intelligence/basket/${basketId}/memory-insights` : null,
    (url: string) => fetchWithToken(url),
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      dedupingInterval: 2000
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