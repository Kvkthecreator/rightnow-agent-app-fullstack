"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";

interface ActiveContextItem {
  type: string;
  content?: string;
  summary?: string;
  relevance_score: number;
}

interface DocumentContext {
  document_id: string;
  analysis_timestamp: string;
  focus_area: string;
  current_themes: string[];
  active_context_items: ActiveContextItem[];
  confidence_score: number;
  last_updated: string;
  status: "analyzing" | "complete" | "error";
}

export function useDocumentContext(documentId?: string, refreshInterval: number = 5000) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<DocumentContext>(
    documentId && user ? `/api/intelligence/document/${documentId}/context` : null,
    (url: string) => fetchWithToken(url),
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