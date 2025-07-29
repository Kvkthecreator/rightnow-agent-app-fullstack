"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/useAuth";
import { fetchWithToken } from "@/lib/fetchWithToken";
import { TriggerEvent, BehavioralPattern, UserAction } from "./useBehavioralTriggers";
import { SmartSuggestion } from "./useSmartSuggestionTiming";

export interface PrioritySuggestion {
  suggestion_id: string;
  type: 'contextual' | 'behavioral' | 'memory' | 'insight';
  content: string;
  priority: number;
  reasoning: string;
  suggested_action?: string;
  confidence: number;
}

export interface ContextualInsight {
  insight_id: string;
  insight_type: 'pattern' | 'connection' | 'opportunity' | 'concern';
  description: string;
  relevance: number;
  supporting_evidence: string[];
  recommended_action?: string;
}

export interface ResponseTrigger {
  trigger_id: string;
  trigger_type: string;
  activation_condition: string;
  response_content: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface AgentResponseData {
  response_id: string;
  document_id: string;
  generated_at: string;
  priority_suggestions: PrioritySuggestion[];
  contextual_insights: ContextualInsight[];
  response_triggers: ResponseTrigger[];
  context_summary: string;
  confidence_score: number;
}

export interface BehaviorAnalysisData {
  analysis_id: string;
  user_session_id: string;
  anticipated_needs: {
    need_id: string;
    need_type: string;
    description: string;
    confidence: number;
    suggested_assistance: string;
  }[];
  suggested_actions: {
    action_id: string;
    action_type: string;
    description: string;
    priority: number;
    timing_suggestion: string;
  }[];
  focus_predictions: {
    prediction_id: string;
    predicted_focus: string;
    confidence: number;
    time_horizon: string;
  }[];
}

export function useContextualAgentResponse(
  documentId: string,
  cursorPosition?: number,
  selectedText?: string,
  recentActions: UserAction[] = [],
  currentContext?: any
) {
  const { user } = useAuth();
  
  const shouldFetch = documentId && user && (
    cursorPosition !== undefined || 
    selectedText || 
    recentActions.length > 0
  );

  const { data, error, isLoading, mutate } = useSWR<AgentResponseData>(
    shouldFetch ? `/api/intelligence/agent/contextual-response` : null,
    async (url: string) => {
      const response = await fetchWithToken(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          cursor_position: cursorPosition,
          selected_text: selectedText,
          recent_actions: recentActions.slice(-10), // Last 10 actions
          current_context: currentContext || {}
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contextual agent response');
      }
      
      return response.json();
    },
    {
      refreshInterval: 0, // Manual refresh only
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      dedupingInterval: 2000
    }
  );

  return {
    prioritySuggestions: data?.priority_suggestions || [],
    contextualInsights: data?.contextual_insights || [],
    responseTriggers: data?.response_triggers || [],
    contextSummary: data?.context_summary || '',
    confidenceScore: data?.confidence_score || 0,
    isLoading,
    error,
    refresh: () => mutate()
  };
}

export function useBehaviorAnalysis(
  userSession: any,
  documentContext: any,
  editingPatterns: any[] = []
) {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR<BehaviorAnalysisData>(
    user && userSession ? `/api/intelligence/agent/behavior-analysis` : null,
    async (url: string) => {
      const response = await fetchWithToken(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_session: userSession,
          document_context: documentContext,
          editing_patterns: editingPatterns
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch behavior analysis');
      }
      
      return response.json();
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 2,
      errorRetryInterval: 2000
    }
  );

  return {
    anticipatedNeeds: data?.anticipated_needs || [],
    suggestedActions: data?.suggested_actions || [],
    focusPredictions: data?.focus_predictions || [],
    isLoading,
    error,
    refresh: () => mutate()
  };
}

// Orchestrator hook that combines behavioral triggers with agent responses
export function useIntelligentAgentCoordination(
  documentId: string,
  triggerEvents: TriggerEvent[],
  behavioralPattern: BehavioralPattern | null,
  recentActions: UserAction[],
  cursorPosition?: number,
  selectedText?: string
) {
  const { user } = useAuth();
  
  // Get contextual agent response based on current trigger
  const latestTrigger = triggerEvents[triggerEvents.length - 1];
  const shouldTriggerResponse = latestTrigger && (
    latestTrigger.type === 'text_selection' ||
    latestTrigger.type === 'typing_pause' ||
    latestTrigger.type === 'extended_pause'
  );

  const contextualResponse = useContextualAgentResponse(
    documentId,
    shouldTriggerResponse ? cursorPosition : undefined,
    shouldTriggerResponse ? selectedText : undefined,
    shouldTriggerResponse ? recentActions : [],
    latestTrigger?.context
  );

  // Get behavioral analysis for proactive suggestions
  const behaviorAnalysis = useBehaviorAnalysis(
    { session_id: Date.now(), behavioral_pattern: behavioralPattern },
    { document_id: documentId, cursor_position: cursorPosition },
    recentActions.map(action => ({
      type: action.type,
      timestamp: action.timestamp,
      data: action.data
    }))
  );

  // Transform API responses into SmartSuggestions
  const generateSmartSuggestions = (): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = [];
    
    // Convert priority suggestions
    contextualResponse.prioritySuggestions.forEach((ps, index) => {
      suggestions.push({
        id: `priority-${ps.suggestion_id}`,
        type: ps.type,
        content: ps.content,
        priority: ps.priority,
        timing: {
          immediate: ps.priority > 0.8,
          delay: ps.priority > 0.8 ? 0 : 1500,
          priority: ps.priority > 0.8 ? 'high' : 'medium',
          reason: 'contextual_agent_response'
        },
        trigger_source: 'agent_api',
        confidence: ps.confidence
      });
    });

    // Convert anticipated needs
    behaviorAnalysis.anticipatedNeeds.forEach((need, index) => {
      suggestions.push({
        id: `need-${need.need_id}`,
        type: 'behavioral',
        content: need.suggested_assistance,
        priority: need.confidence,
        timing: {
          immediate: false,
          delay: 3000,
          priority: need.confidence > 0.7 ? 'high' : 'medium',
          reason: 'anticipated_user_need'
        },
        trigger_source: 'behavior_analysis',
        confidence: need.confidence
      });
    });

    return suggestions.sort((a, b) => b.priority - a.priority);
  };

  return {
    ...contextualResponse,
    ...behaviorAnalysis,
    smartSuggestions: generateSmartSuggestions(),
    isActive: shouldTriggerResponse,
    lastTrigger: latestTrigger
  };
}