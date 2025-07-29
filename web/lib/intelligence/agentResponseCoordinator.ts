"use client";

import { TriggerEvent, BehavioralPattern, UserAction } from "./useBehavioralTriggers";
import { SmartSuggestion } from "./useSmartSuggestionTiming";
import { PrioritySuggestion, ContextualInsight } from "./useContextualAgentResponse";

export interface CoordinatedResponse {
  id: string;
  type: 'immediate' | 'contextual' | 'anticipatory';
  priority: number;
  content: string;
  trigger_source: string;
  recommended_panel: 'context' | 'suggestions' | 'memory' | 'anticipation';
  timing: {
    delay: number;
    show_duration?: number;
    auto_dismiss?: boolean;
  };
  actions?: {
    primary?: { label: string; action: string };
    secondary?: { label: string; action: string };
  };
}

export interface CoordinationContext {
  documentId: string;
  cursorPosition?: number;
  selectedText?: string;
  isTyping: boolean;
  currentPanel: string;
  userFocusLevel: 'low' | 'medium' | 'high';
  sessionDuration: number;
}

export class AgentResponseCoordinator {
  private activeResponses: Map<string, CoordinatedResponse> = new Map();
  private responseHistory: CoordinatedResponse[] = [];
  private coordinationRules: CoordinationRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.coordinationRules = [
      // Immediate response rules
      {
        id: 'text_selection_immediate',
        condition: (context) => !!(context.selectedText && context.selectedText.length > 10),
        response: (context, trigger) => ({
          id: `selection-${Date.now()}`,
          type: 'immediate',
          priority: 0.9,
          content: `Analyze: "${context.selectedText?.substring(0, 30)}..."`,
          trigger_source: 'text_selection',
          recommended_panel: 'context',
          timing: { delay: 0 },
          actions: {
            primary: { label: "Analyze", action: "analyze_selection" },
            secondary: { label: "Connect", action: "find_connections" }
          }
        }),
        priority: 10
      },

      // Contextual response rules
      {
        id: 'typing_pause_contextual',
        condition: (context, trigger) => 
          !!(trigger?.type === 'typing_pause' && !context.isTyping),
        response: (context, trigger) => ({
          id: `pause-${Date.now()}`,
          type: 'contextual',
          priority: 0.7,
          content: 'Continue with related ideas or expand this section?',
          trigger_source: 'typing_pause',
          recommended_panel: 'suggestions',
          timing: { delay: 2000, auto_dismiss: true, show_duration: 10000 },
          actions: {
            primary: { label: "Suggest", action: "generate_suggestions" }
          }
        }),
        priority: 7
      },

      // Extended pause rule
      {
        id: 'extended_pause_anticipatory',
        condition: (context, trigger) => 
          !!(trigger?.type === 'extended_pause'),
        response: (context, trigger) => ({
          id: `extended-${Date.now()}`,
          type: 'anticipatory',
          priority: 0.8,
          content: 'Need inspiration? Here are some relevant connections...',
          trigger_source: 'extended_pause',
          recommended_panel: 'anticipation',
          timing: { delay: 1000, show_duration: 15000 },
          actions: {
            primary: { label: "Show Ideas", action: "show_inspiration" },
            secondary: { label: "Find Patterns", action: "analyze_patterns" }
          }
        }),
        priority: 8
      },

      // Focus change rule
      {
        id: 'focus_change_contextual',
        condition: (context, trigger) => 
          !!(trigger?.type === 'focus_change'),
        response: (context, trigger) => ({
          id: `focus-${Date.now()}`,
          type: 'contextual',
          priority: 0.6,
          content: 'Context updated for this section',
          trigger_source: 'focus_change',
          recommended_panel: 'context',
          timing: { delay: 1500, auto_dismiss: true, show_duration: 8000 }
        }),
        priority: 6
      },

      // User frustration detection
      {
        id: 'frustration_support',
        condition: (context, trigger, pattern) => 
          !!(pattern?.pause_frequency === 'frequent' && 
          pattern?.typing_rhythm === 'slow'),
        response: (context, trigger, pattern) => ({
          id: `support-${Date.now()}`,
          type: 'anticipatory',
          priority: 0.85,
          content: 'Taking your time? I can help with ideas or organization.',
          trigger_source: 'behavioral_pattern',
          recommended_panel: 'anticipation',
          timing: { delay: 3000, show_duration: 12000 },
          actions: {
            primary: { label: "Get Help", action: "show_assistance" },
            secondary: { label: "Organize", action: "suggest_structure" }
          }
        }),
        priority: 9
      }
    ];

    // Sort rules by priority (highest first)
    this.coordinationRules.sort((a, b) => b.priority - a.priority);
  }

  processContext(
    context: CoordinationContext,
    triggerEvents: TriggerEvent[],
    behavioralPattern: BehavioralPattern | null,
    existingSuggestions: SmartSuggestion[] = [],
    apiSuggestions: PrioritySuggestion[] = [],
    contextualInsights: ContextualInsight[] = []
  ): CoordinatedResponse[] {
    const latestTrigger = triggerEvents[triggerEvents.length - 1];
    const newResponses: CoordinatedResponse[] = [];

    // Process coordination rules
    for (const rule of this.coordinationRules) {
      try {
        if (rule.condition(context, latestTrigger, behavioralPattern)) {
          const response = rule.response(context, latestTrigger, behavioralPattern);
          
          // Check if we already have a similar response
          if (!this.isDuplicateResponse(response)) {
            newResponses.push(response);
            this.activeResponses.set(response.id, response);
            this.responseHistory.push(response);
            
            // Limit to prevent overwhelming user
            if (newResponses.length >= 2) break;
          }
        }
      } catch (error) {
        console.warn(`Error processing coordination rule ${rule.id}:`, error);
      }
    }

    // Integrate API suggestions
    this.integrateAPISuggestions(apiSuggestions, contextualInsights, newResponses);

    // Clean up old responses
    this.cleanupOldResponses();

    // Sort by priority and timing
    return this.prioritizeResponses([...this.activeResponses.values()]);
  }

  private integrateAPISuggestions(
    apiSuggestions: PrioritySuggestion[],
    contextualInsights: ContextualInsight[],
    newResponses: CoordinatedResponse[]
  ) {
    // Convert high-priority API suggestions to coordinated responses
    apiSuggestions
      .filter(s => s.priority > 0.7)
      .slice(0, 2) // Limit API suggestions
      .forEach(suggestion => {
        const response: CoordinatedResponse = {
          id: `api-${suggestion.suggestion_id}`,
          type: 'contextual',
          priority: suggestion.priority,
          content: suggestion.content,
          trigger_source: 'api_suggestion',
          recommended_panel: this.mapSuggestionTypeToPanel(suggestion.type),
          timing: { 
            delay: suggestion.priority > 0.8 ? 500 : 2000,
            show_duration: 12000,
            auto_dismiss: suggestion.priority < 0.8
          },
          actions: suggestion.suggested_action ? {
            primary: { label: "Try This", action: suggestion.suggested_action }
          } : undefined
        };

        if (!this.isDuplicateResponse(response)) {
          newResponses.push(response);
          this.activeResponses.set(response.id, response);
        }
      });

    // Convert insights to low-priority background responses
    contextualInsights
      .filter(i => i.relevance > 0.6)
      .slice(0, 1)
      .forEach(insight => {
        const response: CoordinatedResponse = {
          id: `insight-${insight.insight_id}`,
          type: 'contextual',
          priority: insight.relevance * 0.7, // Lower priority than suggestions
          content: insight.description,
          trigger_source: 'contextual_insight',
          recommended_panel: 'context',
          timing: { 
            delay: 5000, // Longer delay for insights
            show_duration: 15000,
            auto_dismiss: true
          }
        };

        if (!this.isDuplicateResponse(response)) {
          this.activeResponses.set(response.id, response);
        }
      });
  }

  private mapSuggestionTypeToPanel(type: string): CoordinatedResponse['recommended_panel'] {
    const mapping: Record<string, CoordinatedResponse['recommended_panel']> = {
      contextual: 'context',
      behavioral: 'suggestions',
      memory: 'memory',
      insight: 'suggestions'
    };
    return mapping[type] || 'suggestions';
  }

  private isDuplicateResponse(newResponse: CoordinatedResponse): boolean {
    const recent = Array.from(this.activeResponses.values())
      .filter(r => Date.now() - parseInt(r.id.split('-')[1]) < 10000); // Last 10 seconds

    return recent.some(existing => 
      existing.trigger_source === newResponse.trigger_source &&
      existing.type === newResponse.type &&
      this.calculateContentSimilarity(existing.content, newResponse.content) > 0.7
    );
  }

  private calculateContentSimilarity(content1: string, content2: string): number {
    const words1 = content1.toLowerCase().split(' ');
    const words2 = content2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  private prioritizeResponses(responses: CoordinatedResponse[]): CoordinatedResponse[] {
    return responses
      .sort((a, b) => {
        // Immediate responses first
        if (a.type === 'immediate' && b.type !== 'immediate') return -1;
        if (b.type === 'immediate' && a.type !== 'immediate') return 1;
        
        // Then by priority
        return b.priority - a.priority;
      })
      .slice(0, 3); // Limit concurrent responses
  }

  private cleanupOldResponses() {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.activeResponses.forEach((response, id) => {
      const responseTime = parseInt(id.split('-')[1]);
      const maxAge = response.timing.show_duration || 20000; // Default 20 seconds
      
      if (now - responseTime > maxAge) {
        expiredIds.push(id);
      }
    });

    expiredIds.forEach(id => this.activeResponses.delete(id));
    
    // Keep response history limited
    this.responseHistory = this.responseHistory.slice(-50);
  }

  dismissResponse(responseId: string) {
    this.activeResponses.delete(responseId);
  }

  getActiveResponses(): CoordinatedResponse[] {
    return Array.from(this.activeResponses.values());
  }

  getResponseHistory(): CoordinatedResponse[] {
    return [...this.responseHistory];
  }

  clearAllResponses() {
    this.activeResponses.clear();
  }
}

interface CoordinationRule {
  id: string;
  condition: (
    context: CoordinationContext, 
    trigger?: TriggerEvent, 
    pattern?: BehavioralPattern | null
  ) => boolean;
  response: (
    context: CoordinationContext, 
    trigger?: TriggerEvent, 
    pattern?: BehavioralPattern | null
  ) => CoordinatedResponse;
  priority: number;
}

// Global coordinator instance
export const globalCoordinator = new AgentResponseCoordinator();