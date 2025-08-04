"use client";

import { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { fetchWithToken } from '@/lib/fetchWithToken';
import type { SubstrateIntelligence } from '@/lib/substrate/types';
import type { IntelligenceEvent } from './changeDetection';
import type { ConversationTriggeredGeneration } from './conversationAnalyzer';

// Unified State Machine for Intelligence Management
export enum ChangeState {
  IDLE = 'idle',
  GENERATING = 'generating',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ERROR = 'error'
}

export interface IntelligenceState {
  // Current intelligence data (single source of truth)
  currentIntelligence: SubstrateIntelligence | null;
  
  // Change management state
  changeState: ChangeState;
  pendingChanges: IntelligenceEvent[];
  
  // Conversation context
  conversationContext: ConversationTriggeredGeneration | null;
  
  // Loading and error states
  isInitialLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  processingMessage: string;
  
  // Activity tracking
  hasActiveSessions: boolean;
  lastUpdateTime: string | null;
}

// Action types for state reducer
type IntelligenceAction =
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_PROCESSING'; payload: { isProcessing: boolean; message?: string } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_INTELLIGENCE'; payload: SubstrateIntelligence | null }
  | { type: 'SET_PENDING_CHANGES'; payload: IntelligenceEvent[] }
  | { type: 'SET_CONVERSATION_CONTEXT'; payload: ConversationTriggeredGeneration | null }
  | { type: 'SET_CHANGE_STATE'; payload: ChangeState }
  | { type: 'SET_ACTIVE_SESSIONS'; payload: boolean }
  | { type: 'SET_LAST_UPDATE_TIME'; payload: string | null }
  | { type: 'RESET_STATE' };

// State reducer for predictable state management
function intelligenceReducer(state: IntelligenceState, action: IntelligenceAction): IntelligenceState {
  switch (action.type) {
    case 'SET_INITIAL_LOADING':
      return { ...state, isInitialLoading: action.payload };
    
    case 'SET_PROCESSING':
      return { 
        ...state, 
        isProcessing: action.payload.isProcessing,
        processingMessage: action.payload.message || '',
        changeState: action.payload.isProcessing 
          ? (state.changeState === ChangeState.IDLE ? ChangeState.GENERATING : state.changeState)
          : state.changeState
      };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload,
        changeState: action.payload ? ChangeState.ERROR : state.changeState,
        isProcessing: false,
        processingMessage: ''
      };
    
    case 'SET_CURRENT_INTELLIGENCE':
      return { 
        ...state, 
        currentIntelligence: action.payload,
        lastUpdateTime: action.payload?.basketInfo?.lastUpdated || new Date().toISOString(),
        changeState: state.changeState === ChangeState.GENERATING ? ChangeState.IDLE : state.changeState
      };
    
    case 'SET_PENDING_CHANGES':
      return { 
        ...state, 
        pendingChanges: action.payload,
        changeState: action.payload.length > 0 ? ChangeState.PENDING_REVIEW : ChangeState.IDLE
      };
    
    case 'SET_CONVERSATION_CONTEXT':
      return { ...state, conversationContext: action.payload };
    
    case 'SET_CHANGE_STATE':
      return { ...state, changeState: action.payload };
    
    case 'SET_ACTIVE_SESSIONS':
      return { ...state, hasActiveSessions: action.payload };
    
    case 'SET_LAST_UPDATE_TIME':
      return { ...state, lastUpdateTime: action.payload };
    
    case 'RESET_STATE':
      return {
        currentIntelligence: null,
        changeState: ChangeState.IDLE,
        pendingChanges: [],
        conversationContext: null,
        isInitialLoading: true,
        isProcessing: false,
        error: null,
        processingMessage: '',
        hasActiveSessions: false,
        lastUpdateTime: null
      };
    
    default:
      return state;
  }
}

// Initial state
const initialState: IntelligenceState = {
  currentIntelligence: null,
  changeState: ChangeState.IDLE,
  pendingChanges: [],
  conversationContext: null,
  isInitialLoading: true,
  isProcessing: false,
  error: null,
  processingMessage: '',
  hasActiveSessions: false,
  lastUpdateTime: null
};

export interface UseUnifiedIntelligenceReturn extends IntelligenceState {
  // Core actions
  generateIntelligence: (conversationContext?: ConversationTriggeredGeneration) => Promise<void>;
  approveChanges: (eventId: string, sections: string[]) => Promise<void>;
  rejectChanges: (eventId: string, reason?: string) => Promise<void>;
  refreshIntelligence: () => Promise<void>;
  
  // Context management
  addContext: (content: any[], metadata?: Record<string, any>) => Promise<void>;
  setConversationContext: (context: ConversationTriggeredGeneration | null) => void;
  
  // Utility actions
  checkForUpdates: () => Promise<void>;
  markAsReviewed: (eventId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Unified Intelligence Hook - Single source of truth for all intelligence state
 * Replaces useThinkingPartner, useBasketIntelligence, useSubstrateIntelligence
 */
export function useUnifiedIntelligence(basketId: string): UseUnifiedIntelligenceReturn {
  const [state, dispatch] = useReducer(intelligenceReducer, initialState);

  // Activity detection for pausing background generation
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      dispatch({ type: 'SET_ACTIVE_SESSIONS', payload: true });
      clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        dispatch({ type: 'SET_ACTIVE_SESSIONS', payload: false });
      }, 5 * 60 * 1000); // 5 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    resetInactivityTimer(); // Initialize

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, []);

  // Fetch current intelligence from substrate API (single source)
  const fetchCurrentIntelligence = useCallback(async () => {
    try {
      const timestamp = Date.now();
      const response = await fetchWithToken(`/api/substrate/basket/${basketId}?t=${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Unified intelligence fetch:', {
          hasData: !!data,
          contextIntent: data.contextUnderstanding?.intent?.substring(0, 100)
        });
        dispatch({ type: 'SET_CURRENT_INTELLIGENCE', payload: data });
      } else {
        dispatch({ type: 'SET_CURRENT_INTELLIGENCE', payload: null });
      }
    } catch (err) {
      console.error('Failed to fetch current intelligence:', err);
      dispatch({ type: 'SET_CURRENT_INTELLIGENCE', payload: null });
    }
  }, [basketId]);

  // Fetch pending changes from events table
  const fetchPendingChanges = useCallback(async () => {
    try {
      const response = await fetchWithToken(`/api/intelligence/pending/${basketId}`);
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_PENDING_CHANGES', payload: data.events || [] });
      } else if (response.status === 404) {
        dispatch({ type: 'SET_PENDING_CHANGES', payload: [] });
      } else {
        console.log(`Pending changes API returned ${response.status}`);
        dispatch({ type: 'SET_PENDING_CHANGES', payload: [] });
      }
    } catch (err) {
      console.error('Failed to fetch pending changes:', err);
      dispatch({ type: 'SET_PENDING_CHANGES', payload: [] });
    }
  }, [basketId]);

  // Initial data load
  useEffect(() => {
    if (basketId) {
      dispatch({ type: 'SET_INITIAL_LOADING', payload: true });
      Promise.all([
        fetchCurrentIntelligence(),
        fetchPendingChanges()
      ]).then(() => {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
      }).catch(err => {
        console.error('Failed to load initial data:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load intelligence data' });
        dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
      });
    }
  }, [basketId, fetchCurrentIntelligence, fetchPendingChanges]);

  // Periodic updates for pending changes
  useEffect(() => {
    if (!basketId || state.isProcessing) return;

    const interval = setInterval(() => {
      fetchPendingChanges();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [basketId, state.isProcessing, fetchPendingChanges]);

  // Generate new intelligence
  const generateIntelligence = useCallback(async (conversationContext?: ConversationTriggeredGeneration) => {
    if (state.isProcessing) return;

    // Set conversation context and processing state
    if (conversationContext) {
      dispatch({ type: 'SET_CONVERSATION_CONTEXT', payload: conversationContext });
      dispatch({ 
        type: 'SET_PROCESSING', 
        payload: { 
          isProcessing: true, 
          message: getLoadingMessage(conversationContext.intent) 
        }
      });
    } else {
      dispatch({ 
        type: 'SET_PROCESSING', 
        payload: { isProcessing: true, message: 'Generating insights...' }
      });
    }

    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetchWithToken(`/api/intelligence/generate/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: conversationContext ? 'conversation' : 'manual',
          conversationContext,
          checkPending: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate intelligence');
      }

      const result = await response.json();
      
      if (result.hasPendingChanges) {
        await fetchPendingChanges();
      } else {
        await fetchPendingChanges();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate intelligence';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Intelligence generation failed:', err);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false } });
    }
  }, [basketId, state.isProcessing, fetchPendingChanges]);

  // Approve changes with optimistic updates
  const approveChanges = useCallback(async (eventId: string, sections: string[]) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, message: 'Applying changes...' } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetchWithToken(`/api/intelligence/approve/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          sections,
          partialApproval: sections.length > 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve changes');
      }

      // Optimistic update: remove from pending and refresh intelligence
      const updatedPending = state.pendingChanges.filter(change => change.id !== eventId);
      dispatch({ type: 'SET_PENDING_CHANGES', payload: updatedPending });
      
      // Clear conversation context
      dispatch({ type: 'SET_CONVERSATION_CONTEXT', payload: null });

      // Refresh intelligence
      await Promise.all([
        fetchCurrentIntelligence(),
        fetchPendingChanges()
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve changes';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to approve changes:', err);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false } });
    }
  }, [basketId, state.pendingChanges, fetchCurrentIntelligence, fetchPendingChanges]);

  // Reject changes
  const rejectChanges = useCallback(async (eventId: string, reason?: string) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, message: 'Rejecting changes...' } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetchWithToken(`/api/intelligence/reject/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject changes');
      }

      // Optimistic update: remove from pending
      const updatedPending = state.pendingChanges.filter(change => change.id !== eventId);
      dispatch({ type: 'SET_PENDING_CHANGES', payload: updatedPending });
      
      // Clear conversation context
      dispatch({ type: 'SET_CONVERSATION_CONTEXT', payload: null });

      // Refresh pending changes
      await fetchPendingChanges();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject changes';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to reject changes:', err);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false } });
    }
  }, [basketId, state.pendingChanges, fetchPendingChanges]);

  // Add context through unified endpoint
  const addContext = useCallback(async (content: any[], metadata?: Record<string, any>) => {
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, message: 'Adding context...' } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/substrate/add-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId,
          content,
          metadata
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add context');
      }

      // Smart refresh after context addition
      setTimeout(async () => {
        await fetchCurrentIntelligence();
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add context';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Failed to add context:', err);
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false } });
    }
  }, [basketId, fetchCurrentIntelligence]);

  // Utility functions
  const refreshIntelligence = useCallback(async () => {
    await fetchCurrentIntelligence();
  }, [fetchCurrentIntelligence]);

  const checkForUpdates = useCallback(async () => {
    await fetchPendingChanges();
  }, [fetchPendingChanges]);

  const markAsReviewed = useCallback(async (eventId: string) => {
    try {
      await fetchWithToken(`/api/intelligence/mark-reviewed/${basketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
    } catch (err) {
      console.error('Failed to mark as reviewed:', err);
    }
  }, [basketId]);

  const setConversationContext = useCallback((context: ConversationTriggeredGeneration | null) => {
    dispatch({ type: 'SET_CONVERSATION_CONTEXT', payload: context });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Memoized return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    ...state,
    
    // Actions
    generateIntelligence,
    approveChanges,
    rejectChanges,
    refreshIntelligence,
    addContext,
    setConversationContext,
    checkForUpdates,
    markAsReviewed,
    clearError
  }), [
    state,
    generateIntelligence,
    approveChanges,
    rejectChanges,
    refreshIntelligence,
    addContext,
    setConversationContext,
    checkForUpdates,
    markAsReviewed,
    clearError
  ]);
}

// Helper function for loading messages
function getLoadingMessage(intent: any): string {
  if (intent.triggerPhrase?.toLowerCase().includes('pattern')) {
    return 'Analyzing patterns in your content...';
  }
  if (intent.triggerPhrase?.toLowerCase().includes('recommend')) {
    return 'Generating strategic recommendations...';
  }
  if (intent.triggerPhrase?.toLowerCase().includes('summary')) {
    return 'Creating comprehensive summary...';
  }
  return 'Generating insights from your content...';
}