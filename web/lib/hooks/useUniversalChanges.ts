"use client";

import { useState, useEffect, useCallback, useReducer, useMemo, useRef } from 'react';
import type { 
  ChangeRequest, 
  ChangeResult, 
  ChangeType, 
  ChangeData,
  ChangeStatus,
  Conflict,
  ValidationError,
  WebSocketPayload
} from '@/lib/services/UniversalChangeService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PendingChange {
  id: string;
  type: ChangeType;
  status: ChangeStatus;
  data: ChangeData;
  timestamp: string;
  actorId: string;
  errors?: string[];
  warnings?: string[];
  conflicts?: Conflict[];
}

export interface ProcessingState {
  [changeId: string]: {
    type: ChangeType;
    message: string;
    startTime: string;
  };
}

export interface ChangeError {
  id: string;
  changeId: string;
  message: string;
  code: string;
  timestamp: string;
  dismissible: boolean;
}

export interface UniversalChangesState {
  // Core state
  pendingChanges: PendingChange[];
  processing: ProcessingState;
  errors: ChangeError[];
  
  // WebSocket connection
  isConnected: boolean;
  connectionError: string | null;
  
  // UI state
  isInitialLoading: boolean;
  lastUpdateTime: string | null;
  
  // Conflict resolution
  unresolvedConflicts: Conflict[];
  
  // Activity tracking
  hasActiveSessions: boolean;
}

type UniversalChangesAction =
  | { type: 'SET_INITIAL_LOADING'; payload: boolean }
  | { type: 'SET_PENDING_CHANGES'; payload: PendingChange[] }
  | { type: 'ADD_PENDING_CHANGE'; payload: PendingChange }
  | { type: 'REMOVE_PENDING_CHANGE'; payload: string }
  | { type: 'UPDATE_CHANGE_STATUS'; payload: { id: string; status: ChangeStatus; errors?: string[] } }
  | { type: 'START_PROCESSING'; payload: { changeId: string; type: ChangeType; message: string } }
  | { type: 'STOP_PROCESSING'; payload: string }
  | { type: 'ADD_ERROR'; payload: ChangeError }
  | { type: 'REMOVE_ERROR'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: { isConnected: boolean; error?: string } }
  | { type: 'SET_CONFLICTS'; payload: Conflict[] }
  | { type: 'RESOLVE_CONFLICT'; payload: string }
  | { type: 'SET_ACTIVE_SESSIONS'; payload: boolean }
  | { type: 'SET_LAST_UPDATE'; payload: string }
  | { type: 'RESET_STATE' };

// ============================================================================
// STATE REDUCER
// ============================================================================

function universalChangesReducer(
  state: UniversalChangesState, 
  action: UniversalChangesAction
): UniversalChangesState {
  switch (action.type) {
    case 'SET_INITIAL_LOADING':
      return { ...state, isInitialLoading: action.payload };

    case 'SET_PENDING_CHANGES':
      return { 
        ...state, 
        pendingChanges: action.payload,
        lastUpdateTime: new Date().toISOString()
      };

    case 'ADD_PENDING_CHANGE':
      return {
        ...state,
        pendingChanges: [...state.pendingChanges, action.payload],
        lastUpdateTime: new Date().toISOString()
      };

    case 'REMOVE_PENDING_CHANGE':
      return {
        ...state,
        pendingChanges: state.pendingChanges.filter(change => change.id !== action.payload),
        lastUpdateTime: new Date().toISOString()
      };

    case 'UPDATE_CHANGE_STATUS':
      return {
        ...state,
        pendingChanges: state.pendingChanges.map(change =>
          change.id === action.payload.id
            ? { ...change, status: action.payload.status, errors: action.payload.errors }
            : change
        )
      };

    case 'START_PROCESSING':
      return {
        ...state,
        processing: {
          ...state.processing,
          [action.payload.changeId]: {
            type: action.payload.type,
            message: action.payload.message,
            startTime: new Date().toISOString()
          }
        }
      };

    case 'STOP_PROCESSING':
      const { [action.payload]: removed, ...remainingProcessing } = state.processing;
      return {
        ...state,
        processing: remainingProcessing
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case 'REMOVE_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload)
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectionError: action.payload.error || null
      };

    case 'SET_CONFLICTS':
      return {
        ...state,
        unresolvedConflicts: action.payload
      };

    case 'RESOLVE_CONFLICT':
      return {
        ...state,
        unresolvedConflicts: state.unresolvedConflicts.filter(
          conflict => conflict.id !== action.payload
        )
      };

    case 'SET_ACTIVE_SESSIONS':
      return { ...state, hasActiveSessions: action.payload };

    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdateTime: action.payload };

    case 'RESET_STATE':
      return {
        pendingChanges: [],
        processing: {},
        errors: [],
        isConnected: false,
        connectionError: null,
        isInitialLoading: true,
        lastUpdateTime: null,
        unresolvedConflicts: [],
        hasActiveSessions: false
      };

    default:
      return state;
  }
}

// Initial state
const initialState: UniversalChangesState = {
  pendingChanges: [],
  processing: {},
  errors: [],
  isConnected: false,
  connectionError: null,
  isInitialLoading: true,
  lastUpdateTime: null,
  unresolvedConflicts: [],
  hasActiveSessions: false
};

// ============================================================================
// WEBSOCKET MANAGER
// ============================================================================

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor(
    private basketId: string,
    private onMessage: (payload: WebSocketPayload) => void,
    private onConnectionChange: (connected: boolean, error?: string) => void
  ) {}

  connect() {
    try {
      // TODO: Replace with actual WebSocket URL when server is implemented
      const wsUrl = `ws://localhost:3001/ws/${this.basketId}`;
      
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      
      // For now, simulate connection (will be replaced with real WebSocket)
      this.simulateConnection();
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.onConnectionChange(false, error instanceof Error ? error.message : 'Connection failed');
      this.scheduleReconnect();
    }
  }

  private simulateConnection() {
    // Simulate WebSocket connection for development
    // This will be replaced with real WebSocket implementation in Phase 4
    
    setTimeout(() => {
      this.onConnectionChange(true);
      console.log('✅ WebSocket connected (simulated)');
      
      // Simulate periodic messages
      this.heartbeatInterval = setInterval(() => {
        // Simulate heartbeat or status updates
      }, 30000);
    }, 1000);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('📤 WebSocket not connected, message queued');
      // TODO: Implement message queuing
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.onConnectionChange(false);
    console.log('🔌 WebSocket disconnected');
  }
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export interface UseUniversalChangesReturn extends UniversalChangesState {
  // Core change operations
  submitChange: (type: ChangeType, data: ChangeData, metadata?: Record<string, any>) => Promise<ChangeResult>;
  approveChanges: (changeIds: string[], sections?: string[]) => Promise<void>;
  rejectChanges: (changeIds: string[], reason?: string) => Promise<void>;
  
  // Convenience methods for specific change types
  updateBasket: (updates: { name?: string; description?: string; status?: string }) => Promise<ChangeResult>;
  createDocument: (title: string, content: string, documentType?: string) => Promise<ChangeResult>;
  updateDocument: (documentId: string, updates: { title?: string; content?: string }) => Promise<ChangeResult>;
  addContext: (content: any[], triggerIntelligence?: boolean) => Promise<ChangeResult>;
  
  // Conflict resolution
  resolveConflict: (conflictId: string, resolution: 'accept_incoming' | 'keep_current' | 'merge') => Promise<void>;
  
  // Utility methods
  refreshChanges: () => Promise<void>;
  dismissError: (errorId: string) => void;
  clearAllErrors: () => void;
  
  // Computed properties
  isProcessing: boolean;
  hasErrors: boolean;
  hasConflicts: boolean;
  processingCount: number;
}

/**
 * Universal Changes Hook - Single source of truth for ALL change management
 * 
 * This hook replaces:
 * - useUnifiedIntelligence
 * - BasketContext  
 * - useThinkingPartner
 * - All individual change hooks
 */
export function useUniversalChanges(basketId: string): UseUniversalChangesReturn {
  const [state, dispatch] = useReducer(universalChangesReducer, initialState);
  const wsManager = useRef<WebSocketManager | null>(null);

  // ========================================================================
  // WEBSOCKET INTEGRATION
  // ========================================================================

  const handleWebSocketMessage = useCallback((payload: WebSocketPayload) => {
    console.log('📨 WebSocket message received:', payload);
    
    switch (payload.event) {
      case 'change_applied':
        // Remove from pending changes or update status
        dispatch({ 
          type: 'UPDATE_CHANGE_STATUS', 
          payload: { 
            id: payload.changeId!, 
            status: 'completed' 
          } 
        });
        break;
        
      case 'change_failed':
        dispatch({ 
          type: 'UPDATE_CHANGE_STATUS', 
          payload: { 
            id: payload.changeId!, 
            status: 'failed',
            errors: [payload.data.error || 'Change failed']
          } 
        });
        break;
        
      case 'conflict_detected':
        dispatch({ 
          type: 'SET_CONFLICTS', 
          payload: payload.data.conflicts || [] 
        });
        break;
        
      case 'user_activity':
        // Handle collaborative user activity
        console.log('👥 User activity:', payload.data);
        break;
    }
  }, []);

  const handleConnectionChange = useCallback((connected: boolean, error?: string) => {
    dispatch({ 
      type: 'SET_CONNECTION_STATUS', 
      payload: { isConnected: connected, error } 
    });
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (basketId) {
      wsManager.current = new WebSocketManager(
        basketId,
        handleWebSocketMessage,
        handleConnectionChange
      );
      
      wsManager.current.connect();
      
      return () => {
        if (wsManager.current) {
          wsManager.current.disconnect();
        }
      };
    }
  }, [basketId, handleWebSocketMessage, handleConnectionChange]);

  // ========================================================================
  // ACTIVITY DETECTION
  // ========================================================================

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

  // ========================================================================
  // CHANGE OPERATIONS
  // ========================================================================

  const submitChange = useCallback(async (
    type: ChangeType, 
    data: ChangeData, 
    metadata: Record<string, any> = {}
  ): Promise<ChangeResult> => {
    const changeId = crypto.randomUUID();
    
    try {
      // Start processing state
      dispatch({ 
        type: 'START_PROCESSING', 
        payload: { 
          changeId, 
          type, 
          message: getProcessingMessage(type) 
        } 
      });

      // Submit change to API
      const response = await fetch('/api/changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: changeId,
          type,
          basketId,
          data,
          metadata,
          origin: 'user'
        }),
      });

      const result: ChangeResult = await response.json();

      if (result.success) {
        console.log(`✅ Change submitted successfully: ${type}`);
        
        // Add to pending changes for optimistic UI
        if (type !== 'intelligence_approve' && type !== 'intelligence_reject') {
          dispatch({
            type: 'ADD_PENDING_CHANGE',
            payload: {
              id: changeId,
              type,
              status: 'completed',
              data,
              timestamp: new Date().toISOString(),
              actorId: 'current_user' // Will be filled by server
            }
          });
        }
      } else {
        console.error(`❌ Change submission failed: ${type}`, result.errors);
        
        // Add error to state
        dispatch({
          type: 'ADD_ERROR',
          payload: {
            id: crypto.randomUUID(),
            changeId,
            message: result.errors?.[0] || 'Change failed',
            code: 'CHANGE_FAILED',
            timestamp: new Date().toISOString(),
            dismissible: true
          }
        });

        // Handle conflicts
        if (result.conflicts && result.conflicts.length > 0) {
          dispatch({ type: 'SET_CONFLICTS', payload: result.conflicts });
        }
      }

      return result;

    } catch (error) {
      console.error('💥 Change submission error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'ADD_ERROR',
        payload: {
          id: crypto.randomUUID(),
          changeId,
          message: errorMessage,
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString(),
          dismissible: true
        }
      });

      return {
        success: false,
        changeId,
        status: 'failed',
        errors: [errorMessage]
      };
      
    } finally {
      // Stop processing state
      dispatch({ type: 'STOP_PROCESSING', payload: changeId });
    }
  }, [basketId]);

  // ========================================================================
  // CONVENIENCE METHODS
  // ========================================================================

  const updateBasket = useCallback(async (updates: { name?: string; description?: string; status?: string }) => {
    return submitChange('basket_update', updates);
  }, [submitChange]);

  const createDocument = useCallback(async (title: string, content: string, documentType = 'general') => {
    return submitChange('document_create', { title, content, documentType });
  }, [submitChange]);

  const updateDocument = useCallback(async (documentId: string, updates: { title?: string; content?: string }) => {
    return submitChange('document_update', { documentId, ...updates });
  }, [submitChange]);

  const addContext = useCallback(async (content: any[], triggerIntelligence = true) => {
    return submitChange('context_add', { content, triggerIntelligenceRefresh: triggerIntelligence });
  }, [submitChange]);

  const approveChanges = useCallback(async (changeIds: string[], sections: string[] = []) => {
    for (const changeId of changeIds) {
      await submitChange('intelligence_approve', {
        eventId: changeId,
        approvedSections: sections,
        partialApproval: sections.length > 0,
        intelligence: {} as any // Will be filled by server
      });
    }
  }, [submitChange]);

  const rejectChanges = useCallback(async (changeIds: string[], reason = '') => {
    for (const changeId of changeIds) {
      await submitChange('intelligence_reject', {
        eventId: changeId,
        reason
      });
    }
  }, [submitChange]);

  // ========================================================================
  // CONFLICT RESOLUTION
  // ========================================================================

  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'accept_incoming' | 'keep_current' | 'merge'
  ) => {
    try {
      // TODO: Implement conflict resolution API call
      console.log(`🔧 Resolving conflict ${conflictId} with strategy: ${resolution}`);
      
      // For now, just remove from local state
      dispatch({ type: 'RESOLVE_CONFLICT', payload: conflictId });
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  }, []);

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  const refreshChanges = useCallback(async () => {
    try {
      const response = await fetch(`/api/changes?basketId=${basketId}&status=pending`);
      const data = await response.json();
      
      if (data.changes) {
        dispatch({ type: 'SET_PENDING_CHANGES', payload: data.changes });
      }
    } catch (error) {
      console.error('Failed to refresh changes:', error);
    }
  }, [basketId]);

  const dismissError = useCallback((errorId: string) => {
    dispatch({ type: 'REMOVE_ERROR', payload: errorId });
  }, []);

  const clearAllErrors = useCallback(() => {
    state.errors.forEach(error => {
      dispatch({ type: 'REMOVE_ERROR', payload: error.id });
    });
  }, [state.errors]);

  // ========================================================================
  // COMPUTED PROPERTIES
  // ========================================================================

  const computedValues = useMemo(() => ({
    isProcessing: Object.keys(state.processing).length > 0,
    hasErrors: state.errors.length > 0,
    hasConflicts: state.unresolvedConflicts.length > 0,
    processingCount: Object.keys(state.processing).length
  }), [state.processing, state.errors, state.unresolvedConflicts]);

  // ========================================================================
  // INITIAL DATA LOAD
  // ========================================================================

  useEffect(() => {
    if (basketId) {
      dispatch({ type: 'SET_INITIAL_LOADING', payload: true });
      
      refreshChanges().finally(() => {
        dispatch({ type: 'SET_INITIAL_LOADING', payload: false });
      });
    }
  }, [basketId, refreshChanges]);

  // ========================================================================
  // RETURN HOOK INTERFACE
  // ========================================================================

  return {
    // State
    ...state,
    ...computedValues,
    
    // Core operations
    submitChange,
    approveChanges,
    rejectChanges,
    
    // Convenience methods
    updateBasket,
    createDocument,
    updateDocument,
    addContext,
    
    // Conflict resolution
    resolveConflict,
    
    // Utility methods
    refreshChanges,
    dismissError,
    clearAllErrors
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getProcessingMessage(type: ChangeType): string {
  switch (type) {
    case 'basket_update':
      return 'Updating basket...';
    case 'document_create':
      return 'Creating document...';
    case 'document_update':
      return 'Saving document...';
    case 'intelligence_approve':
      return 'Applying intelligence changes...';
    case 'intelligence_reject':
      return 'Rejecting changes...';
    case 'context_add':
      return 'Adding context...';
    case 'block_create':
      return 'Creating block...';
    case 'block_update':
      return 'Updating block...';
    default:
      return 'Processing change...';
  }
}