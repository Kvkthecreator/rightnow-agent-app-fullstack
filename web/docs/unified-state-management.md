# Unified Intelligence State Management

## Overview
Chapter 2.3 completes the modal-based foundation by implementing unified state management that eliminates redundancies and creates a single source of truth for all intelligence operations.

## Problems Solved

### Before: Multiple State Sources
```typescript
// Redundant and conflicting hooks
useThinkingPartner()      // Current intelligence + events
useBasketIntelligence()   // Legacy SWR-based polling
useSubstrateIntelligence() // Direct substrate API calls

// State duplication across:
// - Events table (primary storage)
// - React state caches
// - Direct API responses
// - Component-level state
```

### After: Single Source of Truth
```typescript
// One hook to rule them all
const {
  currentIntelligence,    // Single source from substrate
  pendingChanges,         // From events table
  changeState,           // State machine driven
  generateIntelligence,   // Unified generation
  approveChanges,        // Optimistic updates
  addContext            // Unified context handling
} = useUnifiedIntelligence(basketId);
```

## State Machine Architecture

### Change States
```typescript
enum ChangeState {
  IDLE = 'idle',                    // No active operations
  GENERATING = 'generating',        // Intelligence being created
  PENDING_REVIEW = 'pending_review', // Changes awaiting user decision
  APPROVED = 'approved',            // Changes applied successfully
  REJECTED = 'rejected',            // Changes dismissed
  ERROR = 'error'                   // Operation failed
}
```

### State Transitions
```
IDLE → GENERATING (user triggers generation)
GENERATING → PENDING_REVIEW (intelligence created)
GENERATING → ERROR (generation failed)
PENDING_REVIEW → APPROVED (user approves)
PENDING_REVIEW → REJECTED (user rejects)
APPROVED → IDLE (changes applied)
REJECTED → IDLE (changes dismissed)
ERROR → IDLE (error cleared)
```

## Unified Hook Interface

### Core State
```typescript
interface IntelligenceState {
  // Data (single source of truth)
  currentIntelligence: SubstrateIntelligence | null;
  pendingChanges: IntelligenceEvent[];
  
  // State machine
  changeState: ChangeState;
  
  // Conversation integration
  conversationContext: ConversationTriggeredGeneration | null;
  
  // UI states
  isInitialLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  processingMessage: string;
  
  // Activity tracking
  hasActiveSessions: boolean;
  lastUpdateTime: string | null;
}
```

### Actions
```typescript
interface UseUnifiedIntelligenceReturn {
  // Core operations
  generateIntelligence: (conversationContext?: ConversationTriggeredGeneration) => Promise<void>;
  approveChanges: (eventId: string, sections: string[]) => Promise<void>;
  rejectChanges: (eventId: string, reason?: string) => Promise<void>;
  
  // Context management
  addContext: (content: any[], metadata?: Record<string, any>) => Promise<void>;
  setConversationContext: (context: ConversationTriggeredGeneration | null) => void;
  
  // Utilities
  refreshIntelligence: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
  markAsReviewed: (eventId: string) => Promise<void>;
  clearError: () => void;
}
```

## Key Features

### 1. Optimistic Updates
```typescript
// Before: Wait for API response
await approveChanges(eventId, sections);
// UI updates after API response

// After: Immediate UI feedback
const approveChanges = async (eventId, sections) => {
  // Optimistic update: remove from pending immediately
  const updatedPending = pendingChanges.filter(change => change.id !== eventId);
  dispatch({ type: 'SET_PENDING_CHANGES', payload: updatedPending });
  
  // Then sync with API
  await apiCall();
};
```

### 2. Conversation Integration
```typescript
// Seamless conversation → generation flow
const generateIntelligence = async (conversationContext?) => {
  if (conversationContext) {
    // Store context for modal display
    dispatch({ type: 'SET_CONVERSATION_CONTEXT', payload: conversationContext });
    
    // Set context-specific loading message
    const message = getLoadingMessage(conversationContext.intent);
    dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true, message }});
  }
  
  // Generate with conversation metadata
  await api.generate({ conversationContext });
};
```

### 3. Predictable State Updates
```typescript
// Reducer pattern for predictable state changes
function intelligenceReducer(state: IntelligenceState, action: IntelligenceAction): IntelligenceState {
  switch (action.type) {
    case 'SET_PROCESSING':
      return { 
        ...state, 
        isProcessing: action.payload.isProcessing,
        processingMessage: action.payload.message || '',
        changeState: action.payload.isProcessing 
          ? ChangeState.GENERATING 
          : state.changeState
      };
    // ... other actions
  }
}
```

### 4. Smart Caching Strategy
```typescript
// Single fetch with timestamp cache-busting
const fetchCurrentIntelligence = useCallback(async () => {
  const timestamp = Date.now();
  const response = await fetchWithToken(`/api/substrate/basket/${basketId}?t=${timestamp}`);
  // Cache in state, events table remains primary source
}, [basketId]);

// Periodic updates only for pending changes
useEffect(() => {
  const interval = setInterval(() => {
    fetchPendingChanges(); // Only check for new events
  }, 30000);
  return () => clearInterval(interval);
}, [basketId, isProcessing]);
```

## API Consolidation

### Before: Multiple Endpoints
```typescript
// Scattered API calls
fetch('/api/substrate/basket/${basketId}')        // Current intelligence
fetch('/api/intelligence/pending/${basketId}')    // Pending changes  
fetch('/api/intelligence/generate/${basketId}')   // Generation
fetch('/api/substrate/add-context')               // Context addition
```

### After: Unified Patterns
```typescript
// Single hook manages all API interactions
useUnifiedIntelligence(basketId) // Handles all endpoints internally

// Consistent request patterns
const generateIntelligence = async (conversationContext) => {
  await fetchWithToken(`/api/intelligence/generate/${basketId}`, {
    method: 'POST',
    body: JSON.stringify({
      origin: conversationContext ? 'conversation' : 'manual',
      conversationContext,
      checkPending: true
    })
  });
};
```

## Performance Optimizations

### 1. Reduced API Calls
- Single intelligence fetch per session
- Periodic pending checks only (30s intervals)
- Smart refresh after context addition
- Optimistic updates for immediate feedback

### 2. Memory Optimization
```typescript
// Memoized return value prevents unnecessary re-renders
return useMemo(() => ({
  ...state,
  generateIntelligence,
  approveChanges,
  // ... other actions
}), [state, generateIntelligence, approveChanges, ...]);
```

### 3. Race Condition Handling
```typescript
// Processing guard prevents overlapping operations
const generateIntelligence = useCallback(async (conversationContext) => {
  if (state.isProcessing) return; // Prevent race conditions
  
  dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: true }});
  // ... operation
  dispatch({ type: 'SET_PROCESSING', payload: { isProcessing: false }});
}, [state.isProcessing]);
```

## Migration Guide

### From useThinkingPartner
```typescript
// Before
const {
  currentIntelligence,
  pendingChanges,
  generateIntelligence,
  approveChanges
} = useThinkingPartner(basketId);

// After - identical interface, better implementation
const {
  currentIntelligence,
  pendingChanges,
  generateIntelligence,
  approveChanges
} = useUnifiedIntelligence(basketId);
```

### From useBasketIntelligence
```typescript
// Before
const { data, isLoading, mutate } = useBasketIntelligence(basketId);

// After
const { 
  currentIntelligence,    // replaces data
  isInitialLoading,      // replaces isLoading
  refreshIntelligence    // replaces mutate
} = useUnifiedIntelligence(basketId);
```

### From useSubstrateIntelligence
```typescript
// Before
const { intelligence, addContext } = useSubstrateIntelligence(basketId);

// After
const { 
  currentIntelligence,   // replaces intelligence
  addContext            // same interface, better implementation
} = useUnifiedIntelligence(basketId);
```

## Error Handling

### Centralized Error Management
```typescript
// All operations use consistent error handling
try {
  await operation();
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Operation failed';
  dispatch({ type: 'SET_ERROR', payload: errorMessage });
}

// Component access to errors
const { error, clearError } = useUnifiedIntelligence(basketId);
```

### Graceful Degradation
```typescript
// Failed intelligence fetch doesn't break the app
const fetchCurrentIntelligence = async () => {
  try {
    const data = await api.fetch();
    dispatch({ type: 'SET_CURRENT_INTELLIGENCE', payload: data });
  } catch (err) {
    // Graceful fallback to null state
    dispatch({ type: 'SET_CURRENT_INTELLIGENCE', payload: null });
  }
};
```

## Testing Strategy

### State Machine Testing
```typescript
// Test state transitions
describe('ChangeState transitions', () => {
  it('transitions from IDLE to GENERATING', () => {
    const state = { changeState: ChangeState.IDLE };
    const action = { type: 'SET_PROCESSING', payload: { isProcessing: true }};
    const newState = intelligenceReducer(state, action);
    expect(newState.changeState).toBe(ChangeState.GENERATING);
  });
});
```

### Integration Testing
```typescript
// Test complete workflows
describe('Conversation → Modal workflow', () => {
  it('handles conversation-triggered generation', async () => {
    const { generateIntelligence } = renderHook(() => useUnifiedIntelligence(basketId));
    const conversationContext = createMockConversationContext();
    
    await act(() => generateIntelligence(conversationContext));
    
    expect(mockApi.generate).toHaveBeenCalledWith({ conversationContext });
  });
});
```

## Benefits Achieved

### ✅ Single Source of Truth
- One hook manages all intelligence state
- Events table as primary storage with React cache
- No more conflicting data sources

### ✅ Predictable State Management
- State machine prevents invalid transitions
- Reducer pattern for consistent updates
- Clear separation of concerns

### ✅ Performance Optimized
- Reduced API calls through smart caching
- Optimistic updates for better UX
- Race condition prevention

### ✅ Conversation Integration
- Seamless conversation → generation → modal flow
- Context preservation throughout workflow
- Unified loading states and error handling

### ✅ Developer Experience
- Simple migration from legacy hooks
- Comprehensive TypeScript types
- Clear documentation and examples
- Deprecation warnings for legacy code

The unified state management system provides a solid foundation for the modal-based architecture while eliminating technical debt and improving performance across the entire intelligence workflow.