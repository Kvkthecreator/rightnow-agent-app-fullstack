# Ambient Companion System - Phase 3.1

## Overview
Phase 3.1 implements a context-aware Thinking Partner with ambient floating companion interface that provides the "looking over shoulder" experience with intelligent awareness of user context and activity.

## Core Components

### 1. Page Context Detection System
**File:** `pageContextDetection.ts`

```typescript
interface PageContext {
  page: 'dashboard' | 'document' | 'timeline' | 'detailed-view';
  content: PageContent;
  userActivity: UserActivity;
  confidence: number;
  timestamp: number;
}
```

**Key Features:**
- **Real-time Context Tracking**: Monitors page type, content, and user behavior
- **Activity Detection**: Tracks typing, scrolling, text selection, cursor movement
- **Engagement Monitoring**: Determines if user is actively engaged (30s timeout)
- **Content Analysis**: Extracts page-specific content information

**Activity Tracking:**
```typescript
interface UserActivity {
  lastAction: string;           // Most recent user action
  timeOnPage: number;          // Time spent on current page
  scrollPosition: number;      // Current scroll position
  recentEdits: DocumentEdit[]; // Last 10 document edits
  cursorPosition?: CursorPosition;
  selectedText?: SelectedText;
  keystrokeCount: number;      // Total keystrokes on page
  mouseMovements: number;      // Mouse movement events
  isActivelyEngaged: boolean;  // Currently active (< 30s since last action)
}
```

### 2. Ambient Floating Companion
**File:** `AmbientCompanion.tsx`

**States:**
- **Collapsed**: Small floating brain icon (scale 0.8)
- **Ambient**: Context-aware message display with pulse animation
- **Expanded**: Full companion panel with quick input and capabilities
- **Minimized**: Hidden (for unknown pages)

**Visual Design:**
```tsx
// Collapsed State
<div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
  <Brain className="h-6 w-6 text-white group-hover:scale-110" />
  {pendingChanges.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse" />}
</div>

// Ambient State  
<div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg p-4">
  <p className="text-sm text-gray-700">{ambientMessage}</p>
  {isActivelyEngaged && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
</div>
```

**Positioning System:**
- **Organic Positioning**: Not edge-locked, moves to avoid content
- **Draggable**: Users can reposition to their preference  
- **Smart Avoidance**: Automatically positions away from key content areas
- **Responsive**: Adapts to window size changes

### 3. Context-Aware Intelligence
**File:** `contextualIntelligence.ts`

**Intelligence Strategies by Page:**

```typescript
// Dashboard Strategy
{
  focusAreas: ['Cross-document patterns', 'Strategic insights', 'Content gaps'],
  analysisDepth: 'moderate',
  responseStyle: 'analytical',
  suggestedPrompts: ['What patterns emerge across my documents?', 'What should I focus on next?']
}

// Document Strategy  
{
  focusAreas: ['Writing flow analysis', 'Content coherence', 'Section development'],
  analysisDepth: 'deep', 
  responseStyle: 'conversational',
  suggestedPrompts: ['How can I expand this section?', 'Is my writing flow coherent?']
}
```

**Contextual Hints Generation:**
```typescript
function generateContextualHints(pageContext: PageContext): string[] {
  const hints = [];
  hints.push(`User is currently on ${page} page`);
  
  if (userActivity.isActivelyEngaged) {
    hints.push('User is actively engaged');
    hints.push(`Recent activity: ${userActivity.lastAction}`);
  }
  
  // Page-specific hints
  if (page === 'document' && userActivity.selectedText) {
    hints.push(`User has selected text: "${selectedText.substring(0, 100)}..."`);
  }
  
  return hints;
}
```

## Ambient Messages by Context

### Dashboard Context
```typescript
// No intelligence yet
"🧠 Ready to analyze your workspace"

// With documents but no themes
"🧠 Processing 3 documents | New patterns emerging | Tap for insights"  

// With themes detected
"🧠 Analyzing 5 documents | Strategy patterns emerging | Ready to synthesize"

// Empty workspace
"🧠 Workspace ready | Add content to begin analysis"
```

### Document Context
```typescript
// Active writing
"🧠 Following your edits | This section developing well | Tap for expansion ideas"

// Good content volume
"🧠 Tracking 847 words | Content flow looks strong | Ready for analysis"

// Just starting
"🧠 Following along | Good start | Tap for writing assistance"

// Empty document
"🧠 Ready to help | Start writing and I'll follow along"
```

### Timeline Context
```typescript
// After spending time
"🧠 Tracking evolution | Major shift detected last week | Explore patterns?"

// Initial view
"🧠 Timeline analysis ready | Patterns across time visible | Tap to explore"
```

### Detailed View Context
```typescript
// With active section
"🧠 Analyzing substrate layer | Technical patterns visible | Deep insights available"

// General view
"🧠 Substrate analysis ready | Technical insights available | Tap for deep dive"
```

## User Interaction Flow

### Complete Workflow
```
1. User lands on page
   → Page context detected
   → Companion appears in ambient state
   → Context-specific message displayed

2. User becomes active
   → Activity tracking begins
   → Engagement indicator appears
   → Message updates based on activity

3. User clicks companion
   → Expands to full panel
   → Shows contextual capabilities
   → Quick input available

4. User asks question
   → Intent analyzed with page context
   → Contextual conversation request created
   → Enhanced loading message shown
   → Intelligence generated with full context

5. Modal opens with results
   → Context-aware title and description
   → User reviews and approves
   → Companion returns to ambient state
```

### Context-Enhanced Conversation
```typescript
// Standard conversation request
{
  userQuery: "What patterns do you see?",
  intent: { type: 'intelligence_generation', confidence: 0.85 }
}

// Enhanced with page context
{
  userQuery: "What patterns do you see?",
  intent: { type: 'intelligence_generation', confidence: 0.85 },
  pageContext: {
    page: 'dashboard',
    content: { basketOverview: { documentCount: 5, dominantThemes: ['strategy'] }},
    userActivity: { timeOnPage: 120000, isActivelyEngaged: true }
  },
  contextualHints: [
    'User is currently on dashboard page',
    'User is actively engaged', 
    'Workspace contains 5 documents with 2,341 words',
    'Dominant themes: strategy, planning'
  ],
  intelligenceType: 'dashboard'
}
```

## Advanced Features

### 1. Proactive Intelligence
```typescript
function shouldTriggerProactiveAnalysis(pageContext: PageContext): boolean {
  switch (pageContext.page) {
    case 'dashboard':
      // After 2+ minutes of review activity
      return userActivity.timeOnPage > 120000 && userActivity.scrollPosition > 0;
      
    case 'document':
      // After significant editing (10+ edits or 5+ edits over 5 minutes)
      return userActivity.recentEdits.length > 10 || 
             (userActivity.recentEdits.length > 5 && userActivity.timeOnPage > 300000);
  }
}
```

### 2. Smart Positioning
```typescript
function calculateOptimalPosition(pageContext: PageContext): { x: number; y: number } {
  switch (pageContext.page) {
    case 'dashboard':
      return { x: width - 280 - margin, y: 120 }; // Avoid main content
      
    case 'document':
      return { x: width - 300 - margin, y: height / 3 }; // Away from writing area
      
    case 'timeline':  
      return { x: margin, y: height / 2 }; // Left side to avoid timeline
  }
}
```

### 3. Activity-Based Adaptation
```typescript
// Typing detected -> Writing assistance focus
if (userActivity.recentEdits.length > 0) {
  capabilities.unshift('Real-time writing assistance');
  message = "🧠 Following your edits | This section developing well";
}

// Text selection -> Analysis focus
if (userActivity.selectedText) {
  capabilities.unshift('Analyze selected text');
  message = "🧠 I see you've selected text | Ready to analyze";
}
```

## Technical Integration

### 1. Unified Intelligence Hook Integration
```typescript
// Enhanced generation method
const generateIntelligence = async (contextualRequest: ContextualConversationRequest) => {
  // Determine contextual loading message
  const loadingMessage = getContextualLoadingMessage(contextualRequest);
  
  // Send enhanced request to API
  await fetchWithToken('/api/intelligence/generate', {
    body: JSON.stringify({
      origin: 'contextual_conversation',
      conversationContext: contextualRequest,
      pageContext: contextualRequest.pageContext,
      contextualHints: contextualRequest.contextualHints
    })
  });
};
```

### 2. Modal Integration
The ambient companion seamlessly integrates with the existing UniversalChangeModal:

```typescript
// Conversation flows into modal with enhanced context
<UniversalChangeModal
  conversationContext={contextualRequest} // Enhanced with page context
  isOpen={pendingChanges.length > 0}
  // ... other props
/>
```

### 3. Performance Optimizations
- **Throttled Updates**: Cursor and scroll events throttled to 1Hz
- **Selective Re-renders**: Context updates only trigger re-renders when significant
- **Smart Event Cleanup**: Automatic cleanup of event listeners on unmount
- **Memory Management**: Recent edits limited to last 10, automatic cleanup

## User Experience Benefits

### ✅ Ambient Awareness
- Always-present but non-intrusive intelligence companion
- Context-aware messaging that feels alive and responsive
- Visual indicators of engagement and pending insights

### ✅ Context Preservation  
- User never loses context when asking questions
- Page-specific intelligence that understands current focus
- Seamless flow from ambient awareness to detailed analysis

### ✅ Natural Interaction
- Organic positioning that adapts to user behavior
- Conversational interface that understands context
- Progressive disclosure from collapsed → ambient → expanded

### ✅ Intelligent Adaptation
- Different capabilities and messaging per page type
- Activity-based feature suggestions
- Proactive insights when appropriate

## Architecture Benefits

### ✅ Built on Unified Foundation
- Uses `useUnifiedIntelligence` hook for all operations
- Maintains compatibility with existing modal workflow
- Preserves conversation analyzer integration

### ✅ Modular Design
- Page context detection is reusable across components
- Contextual intelligence strategies are extensible
- Ambient companion can be integrated on any page

### ✅ Performance Optimized
- Efficient event handling with proper cleanup
- Smart re-rendering with useMemo and useCallback
- Minimal overhead for context tracking

The ambient companion system creates a truly intelligent, context-aware assistant that feels like having an expert looking over your shoulder, ready to help with exactly what you're working on, when you need it.