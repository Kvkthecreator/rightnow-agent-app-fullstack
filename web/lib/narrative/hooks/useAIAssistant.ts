/**
 * Narrative Hook: AI Assistant
 * 
 * This hook provides conversational AI assistance through the narrative API layer.
 * It enables natural dialogue about the user's project with contextual understanding.
 * 
 * CRITICAL: This hook must NEVER expose technical substrate vocabulary.
 * All interactions are conversational and user-friendly.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';

// User-facing conversational interfaces
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  suggestions?: ConversationSuggestion[];
  followUpQuestions?: string[];
  context?: {
    assistantPersonality: 'curious_learner' | 'knowledgeable_guide' | 'strategic_partner' | 'creative_collaborator';
    userEngagementLevel: 'new_user' | 'exploring' | 'actively_building' | 'seeking_insights';
    conversationFlow: 'greeting' | 'guidance' | 'analysis_sharing' | 'problem_solving' | 'brainstorming';
  };
}

export interface ConversationSuggestion {
  action: string;
  description: string;
  userBenefit: string;
  priority: 'immediate' | 'helpful' | 'explore_later';
}

export interface ConversationContext {
  intelligenceLevel: string;
  confidenceLevel: string;
  projectState: string;
  themesAvailable: boolean;
  suggestedTopics: string[];
}

export interface QuickAction {
  label: string;
  message: string;
  description: string;
}

interface UseAIAssistantOptions {
  autoLoadContext?: boolean;
  saveConversationHistory?: boolean;
  userContext?: {
    name?: string;
    projectType?: string;
  };
}

interface UseAIAssistantResult {
  // Conversation data
  messages: ConversationMessage[];
  conversationContext: ConversationContext | null;
  conversationStarters: string[];
  quickActions: QuickAction[];
  
  // State management
  loading: boolean;
  error: string | null;
  typing: boolean;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  useQuickAction: (action: QuickAction) => Promise<void>;
  clearConversation: () => void;
  refreshContext: () => Promise<void>;
  
  // Status
  isReady: boolean;
  canSendMessage: boolean;
  lastResponseTime: string | null;
}

/**
 * Hook for conversational AI assistance
 * 
 * Provides natural language interaction with AI about the user's project.
 * Maintains conversation history and contextual understanding.
 */
export function useAIAssistant(
  basketId: string,
  options: UseAIAssistantOptions = {}
): UseAIAssistantResult {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<string | null>(null);
  
  const conversationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    autoLoadContext = true,
    saveConversationHistory = true,
    userContext
  } = options;

  /**
   * Load conversation context and starters
   */
  const loadConversationContext = useCallback(async () => {
    if (!user || !basketId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('contextType', 'general');

      const response = await fetch(`/api/intelligence/narrative/${basketId}/conversation?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load conversation context');
      }

      const data = await response.json();

      if (!data.success) {
        // Handle graceful fallback for context loading issues
        setConversationStarters(data.fallbackStarters || [
          "Hi! What would you like to know about your project?",
          "I'm ready to help - what can I assist you with?",
          "What aspect of your work interests you most?"
        ]);
        setQuickActions([]);
        setConversationContext(null);
        return;
      }

      setConversationStarters(data.conversationStarters || []);
      setQuickActions(data.quickActions || []);
      setConversationContext(data.conversationContext || null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation context';
      setError(errorMessage);
      
      // Set fallback context
      setConversationStarters([
        "Hi! What would you like to know about your project?",
        "I'm ready to help - what can I assist you with?"
      ]);
      setQuickActions([]);
      
      console.error('Conversation context error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, basketId]);

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !basketId || !message.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Add user message immediately
    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setTyping(true);
    setError(null);

    try {
      const requestBody = {
        message: message.trim(),
        userContext,
        conversationHistory: saveConversationHistory ? messages.slice(-5) : [], // Last 5 messages for context
        requestType: 'chat'
      };

      const response = await fetch(`/api/intelligence/narrative/${basketId}/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      if (!data.success) {
        // Handle graceful fallback with conversation data if available
        if (data.conversation) {
          const assistantMessage: ConversationMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            message: data.conversation.message,
            timestamp: new Date(),
            suggestions: data.conversation.suggestions || [],
            followUpQuestions: data.conversation.followUpQuestions || [],
            context: {
              assistantPersonality: data.conversation.assistantPersonality || 'helpful_guide',
              userEngagementLevel: data.conversation.userEngagementLevel || 'exploring',
              conversationFlow: data.conversation.conversationFlow || 'guidance'
            }
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setLastResponseTime(data.metadata?.processingTime || null);
          return;
        }
        
        throw new Error(data.error || 'Invalid response from AI');
      }

      // Add AI response message
      const assistantMessage: ConversationMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        message: data.conversation.message,
        timestamp: new Date(),
        suggestions: data.conversation.suggestions || [],
        followUpQuestions: data.conversation.followUpQuestions || [],
        context: {
          assistantPersonality: data.conversation.assistantPersonality,
          userEngagementLevel: data.conversation.userEngagementLevel,
          conversationFlow: data.conversation.conversationFlow
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastResponseTime(data.metadata?.processingTime || null);
      conversationIdRef.current = data.metadata?.conversationId || null;

    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, don't show error
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to conversation
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        message: "I'm having trouble right now, but I'm still here to help! Could you try asking me again?",
        timestamp: new Date(),
        suggestions: [
          {
            action: "Try again",
            description: "Send your message again",
            userBenefit: "Get the response you were looking for",
            priority: 'immediate'
          }
        ],
        followUpQuestions: ["What would you like to know about your project?"]
      };
      
      setMessages(prev => [...prev, errorMessage]);
      console.error('Send message error:', err);
    } finally {
      setTyping(false);
      abortControllerRef.current = null;
    }
  }, [user, basketId, userContext, saveConversationHistory, messages]);

  /**
   * Use a quick action (pre-defined message)
   */
  const useQuickAction = useCallback(async (action: QuickAction) => {
    await sendMessage(action.message);
  }, [sendMessage]);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    conversationIdRef.current = null;
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setTyping(false);
  }, []);

  /**
   * Refresh conversation context
   */
  const refreshContext = useCallback(async () => {
    await loadConversationContext();
  }, [loadConversationContext]);

  // Load initial context
  useEffect(() => {
    if (autoLoadContext) {
      loadConversationContext();
    }
  }, [autoLoadContext, loadConversationContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Derived state
  const isReady = !loading && error === null;
  const canSendMessage = isReady && !typing && user !== null && basketId !== null;

  return {
    // Conversation data
    messages,
    conversationContext,
    conversationStarters,
    quickActions,
    
    // State
    loading,
    error,
    typing,
    
    // Actions
    sendMessage,
    useQuickAction,
    clearConversation,
    refreshContext,
    
    // Status
    isReady,
    canSendMessage,
    lastResponseTime
  };
}

/**
 * Simplified hook for basic AI conversation without advanced features
 */
export function useBasicAIAssistant(
  basketId: string,
  userContext?: { name?: string }
) {
  return useAIAssistant(basketId, {
    autoLoadContext: true,
    saveConversationHistory: false,
    userContext
  });
}

/**
 * Advanced hook with full conversation features and history
 */
export function useAdvancedAIAssistant(
  basketId: string,
  userContext?: { name?: string; projectType?: string }
) {
  return useAIAssistant(basketId, {
    autoLoadContext: true,
    saveConversationHistory: true,
    userContext
  });
}