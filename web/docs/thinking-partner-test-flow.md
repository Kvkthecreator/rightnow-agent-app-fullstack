# Thinking Partner Integration Test Flow

## Test Scenario 1: Dashboard Context
1. Navigate to `/baskets/[id]/work`
2. Locate YarnnnThinkingPartner component
3. Enter: "What patterns do you see in my research?"
4. Click "Generate Insights" or press Cmd+Enter
5. Verify:
   - Loading state shows "Thinking..."
   - API call to `/api/intelligence/generate/[basketId]`
   - Context includes `page: 'dashboard'`
   - Insights appear in approval modal
   - Pending count updates

## Test Scenario 2: Document Context
1. Navigate to `/baskets/[id]/work/documents/[docId]`
2. Use ThinkingPartner with document-specific question
3. Verify context includes `documentId`
4. Check insights are document-relevant

## Test Scenario 3: Approval Flow
1. Generate insights via ThinkingPartner
2. Open YarnnnInsightApproval modal
3. Select insights to approve
4. Click "Apply Selected"
5. Verify substrate updates

## Expected API Payload Structure
```json
{
  "prompt": "user question",
  "context": {
    "page": "dashboard|document|timeline",
    "documentId": "optional",
    "confidence": 0.8,
    "userActivity": {},
    "visibleContent": {
      "route": "/baskets/[id]/work",
      "search": "",
      "hash": ""
    }
  },
  "requestType": "thinking_partner_contextual",
  "options": {
    "includePatternAnalysis": true,
    "includeMemoryConnections": true,
    "includeActionableInsights": true,
    "maxInsights": 5
  }
}
```

## Integration Points Verified

### 1. YarnnnThinkingPartner Component
- ✅ Uses `useUniversalChanges(basketId)` hook
- ✅ Uses `usePageContext(basketId)` for context awareness
- ✅ Makes direct fetch calls to `/api/intelligence/generate/${basketId}`
- ✅ Passes comprehensive context package
- ✅ Handles loading states and user feedback

### 2. ConsciousnessDashboard Integration
- ✅ Imports YarnnnThinkingPartner component
- ✅ Renders with basketId prop
- ✅ Connected to existing handleThoughtCapture
- ✅ Positioned after DashboardNextSteps

### 3. Intelligence API Enhancement
- ✅ Accepts context-aware parameters (prompt, context, requestType, options)
- ✅ Builds enhanced context with user, basket, workspace, page data
- ✅ Fetches substrate context (documents, blocks, context_items, raw_dumps)
- ✅ Calls Python agent backend with full payload
- ✅ Generates context-aware mock insights as fallback
- ✅ Stores audit events with context and metrics

### 4. Universal Changes Integration
- ✅ Has generateIntelligence method available
- ✅ Manages pending changes from intelligence generation
- ✅ Connects to approval workflow

## Mock Response Examples

### Dashboard Context Response
```json
{
  "success": true,
  "insights": [
    {
      "id": "mock_dash_1234567890",
      "type": "substrate_overview",
      "title": "Research Substrate Analysis",
      "description": "Your research contains 5000 words across multiple sources...",
      "confidence": 0.7,
      "evidence": ["5000 total words", "15 raw dumps processed"],
      "suggestions": ["Synthesize main themes", "Identify research gaps"]
    }
  ],
  "metadata": {
    "basketId": "basket-123",
    "contextUsed": true,
    "requestType": "thinking_partner_contextual"
  }
}
```

### Document Context Response
```json
{
  "success": true,
  "insights": [
    {
      "id": "mock_doc_1234567890",
      "type": "document_analysis",
      "title": "Document Analysis Opportunity",
      "description": "Based on your current document context, I can help analyze patterns across your 5 documents.",
      "confidence": 0.8,
      "evidence": ["5 documents in substrate", "Document page context detected"],
      "suggestions": ["Compare themes across documents", "Extract key insights"]
    }
  ]
}
```

## Debugging Tips

1. **Check Browser Console**: Look for 🎯 context logging messages
2. **Network Tab**: Verify API calls to `/api/intelligence/generate/[basketId]`
3. **Context Confidence**: Check displayed confidence percentage
4. **Pending Changes**: Monitor pending count badge updates
5. **WebSocket Connection**: Ensure real-time updates work

## Known Limitations

- Python agent backend may be unavailable (graceful fallback to mocks)
- Context confidence depends on page detection accuracy  
- Rate limiting applies to automatic generation (not manual)
- Mock insights are context-aware but not AI-generated

## Success Criteria

- ✅ ThinkingPartner renders on dashboard
- ✅ Context awareness shows correct page
- ✅ Generate Insights button triggers API call
- ✅ Loading states display correctly
- ✅ Insights appear in approval modal
- ✅ Pending count updates reflect new insights
- ✅ User can approve and apply insights
- ✅ Substrate updates after approval