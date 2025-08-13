import { apiClient, timeoutSignal } from './http';
import {
  SuggestionSchema,
  type Suggestion,
} from './contracts';

/**
 * Suggestion API functions with Zod validation
 */

// Get suggestions for a basket
export async function getSuggestions(basketId: string): Promise<Suggestion[]> {
  try {
    const response = await apiClient({
      url: `/api/intelligence/basket/${basketId}/comprehensive`,
      method: 'GET',
      signal: timeoutSignal(15000),
    });
    
    // Handle different response formats from intelligence API
    if (response && typeof response === 'object') {
      const data = response as any;
      
      // Check for suggestions array in response
      let suggestions: any[] = [];
      
      if (Array.isArray(data.suggestions)) {
        suggestions = data.suggestions;
      } else if (Array.isArray(data.intelligentSuggestions)) {
        suggestions = data.intelligentSuggestions;
      } else if (Array.isArray(data)) {
        suggestions = data;
      }
      
      // Transform to our Suggestion schema format
      return suggestions.map((item, index) => {
        try {
          return SuggestionSchema.parse({
            id: item.id || `suggestion-${basketId}-${index}`,
            basket_id: basketId,
            type: item.type || 'insight',
            title: item.title || item.summary || 'Untitled suggestion',
            description: item.description || item.content || '',
            confidence: typeof item.confidence === 'number' ? item.confidence : 0.8,
            metadata: item.metadata || {},
            created_at: item.created_at || new Date().toISOString(),
          });
        } catch (parseError) {
          console.warn('Failed to parse suggestion:', item, parseError);
          // Return fallback suggestion
          return {
            id: `fallback-${index}`,
            basket_id: basketId,
            type: 'insight' as const,
            title: 'Suggestion parsing error',
            description: 'Unable to parse suggestion data',
            confidence: 0.1,
            created_at: new Date().toISOString(),
          };
        }
      });
      
    }
    
    return [];
    
  } catch (error) {
    console.debug('[suggestions] API error:', error);
    // Return empty array on error to not break the UI
    return [];
  }
}

// Get thinking partner suggestions (alternative endpoint)
export async function getThinkingPartnerSuggestions(basketId: string): Promise<Suggestion[]> {
  try {
    const response = await apiClient({
      url: `/api/intelligence/generate/${basketId}`,
      method: 'POST',
      body: { action: 'thinking_partner' },
      signal: timeoutSignal(20000),
    });
    
    if (response && typeof response === 'object') {
      const data = response as any;
      
      // Transform response to Suggestion format
      const suggestions: Suggestion[] = [];
      
      if (data.suggestions && Array.isArray(data.suggestions)) {
        data.suggestions.forEach((item: any, index: number) => {
          try {
            suggestions.push(SuggestionSchema.parse({
              id: item.id || `thinking-${basketId}-${index}`,
              basket_id: basketId,
              type: 'insight',
              title: item.title || 'Thinking partner insight',
              description: item.description || item.content || '',
              confidence: item.confidence || 0.8,
              metadata: { source: 'thinking_partner', ...item.metadata },
              created_at: new Date().toISOString(),
            }));
          } catch (parseError) {
            console.warn('Failed to parse thinking partner suggestion:', item);
          }
        });
      }
      
      return suggestions;
    }
    
    return [];
    
  } catch (error) {
    console.debug('[thinking-partner] API error:', error);
    return [];
  }
}