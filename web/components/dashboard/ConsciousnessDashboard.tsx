"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedIntelligence } from '@/lib/intelligence/useUnifiedIntelligence';
import { IdentityAnchorHeader } from './IdentityAnchorHeader';
import { ContentInventorySection } from '@/components/detailed-view/ContentInventorySection';
import { NarrativeUnderstanding } from './NarrativeUnderstanding';
import { ContextSuggestions } from './ContextSuggestions';
import { FloatingCommunication } from './FloatingCommunication';
import { UniversalChangeModal } from '@/components/intelligence/UniversalChangeModal';
import OrganicSpinner from '@/components/ui/OrganicSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useBasket } from '@/contexts/BasketContext';
import { 
  analyzeConversationIntent, 
  createConversationGenerationRequest,
  type ConversationTriggeredGeneration 
} from '@/lib/intelligence/conversationAnalyzer';
import { ToastContainer, useToast } from '@/components/ui/Toast';

interface ConsciousnessDashboardProps {
  basketId: string;
}

export function ConsciousnessDashboard({ basketId }: ConsciousnessDashboardProps) {
  const router = useRouter();
  const { toasts, removeToast, showSuccess, showInfo } = useToast();
  
  // Get basket data from context
  const { basket, updateBasketName } = useBasket();
  
  // Use the unified intelligence hook (replaces useThinkingPartner, useBasketIntelligence, etc.)
  const {
    currentIntelligence,
    pendingChanges,
    isProcessing,
    isInitialLoading,
    error,
    processingMessage,
    conversationContext,
    generateIntelligence,
    approveChanges,
    rejectChanges,
    addContext,
    setConversationContext,
    clearError
  } = useUnifiedIntelligence(basketId);

  // Handle context capture from floating communication with conversation analysis
  const handleContextCapture = async (capturedContent: any) => {
    try {
      if (capturedContent.type === 'text') {
        // Analyze conversation intent
        const intent = analyzeConversationIntent({
          userInput: capturedContent.content,
          timestamp: capturedContent.timestamp
        });

        console.log('🤖 Conversation intent analyzed:', intent);
        
        if (intent.shouldGenerateIntelligence) {
          // Create conversation context and generate intelligence
          const conversationGenRequest = createConversationGenerationRequest(
            {
              userInput: capturedContent.content,
              timestamp: capturedContent.timestamp
            },
            intent
          );
          
          // Generate intelligence with conversation context - unified hook handles all state
          await generateIntelligence(conversationGenRequest);
        } else {
          // For context addition or direct responses, use unified addContext
          await addContext([{
            type: 'text',
            content: capturedContent.content,
            metadata: { 
              timestamp: capturedContent.timestamp,
              conversationIntent: intent.type,
              confidence: intent.confidence
            }
          }]);
          
          // Show appropriate feedback for non-intelligence conversations
          if (intent.type === 'context_addition') {
            showSuccess('Context Added', 'Your input has been added to the workspace');
          } else if (intent.type === 'direct_response') {
            showInfo('Noted', 'Thanks for the input - let me know if you need analysis!');
          } else if (intent.type === 'clarification') {
            showInfo('Got it', 'Feel free to ask me to analyze patterns or generate insights');
          }
          
          console.log('📝 Context added successfully for:', intent.type);
        }
        
      } else if (capturedContent.type === 'file') {
        // Handle file upload through unified context addition
        const formData = new FormData();
        formData.append('basketId', basketId);
        formData.append('files', capturedContent.file);
        
        const response = await fetch('/api/substrate/add-context', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Failed to upload file');
        
      } else if (capturedContent.type === 'generate') {
        // Manual intelligence generation
        await generateIntelligence();
      }
      
    } catch (error) {
      console.error('Failed to process captured content:', error);
    }
  };

  // Handle checking pending changes from FAB - now opens modal
  const handleCheckPendingChanges = () => {
    // The modal will automatically open when pendingChanges exist
    console.log('User requested to check pending changes:', pendingChanges);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'document_creation') {
      router.push(`/baskets/${basketId}/work/documents/new?suggestion=${encodeURIComponent(suggestion.title)}&preview=${encodeURIComponent(suggestion.preview)}`);
    } else if (suggestion.type === 'analysis') {
      router.push(`/baskets/${basketId}/work/detailed-view`);
    }
  };

  // Handle basket name change - now much simpler!
  const handleNameChange = async (newName: string) => {
    // The context handles all the API calls and state updates
    await updateBasketName(newName);
  };

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={() => window.location.reload()}
        title="Failed to load thinking partner dashboard"
      />
    );
  }

  // Show loading spinner during initial data fetch or processing
  if (isInitialLoading || isProcessing) {
    const loadingMessage = processingMessage || 
      (isInitialLoading ? 'Basket loading... please wait' : 'Processing your request...');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <OrganicSpinner size="lg" />
          <p className="text-lg text-gray-600 mt-6">{loadingMessage}</p>
          {conversationContext && (
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              "{conversationContext.userQuery}"
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show empty state only after loading is complete
  if (!currentIntelligence && pendingChanges.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold mb-2">Thinking partner ready...</h2>
          <p className="text-gray-600">This workspace is ready for your thoughts and ideas.</p>
        </div>
      </div>
    );
  }

  // Transform intelligence data for display (fallback to safe defaults)
  const transformedData = currentIntelligence ? transformToConsciousnessData(currentIntelligence) : getDefaultTransformedData();
  
  // Debug: log what data we're actually getting
  console.log('🔍 ConsciousnessDashboard Debug:', {
    hasCurrentIntelligence: !!currentIntelligence,
    personalizedInsight: transformedData.narrative.personalizedInsight?.substring(0, 100),
    intelligenceSource: currentIntelligence ? 'substrate' : 'default'
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Dashboard Content - No more width adjustment needed for modal */}
      <div className="w-full">
        <div className="container mx-auto py-6 space-y-6 max-w-6xl px-4">
          
          {/* Identity Anchor Header */}
          <IdentityAnchorHeader
            basketName={basket?.name || 'Untitled Workspace'}
            suggestedName={transformedData.suggestedName}
            status={transformedData.status}
            lastActive={basket?.updated_at || new Date().toISOString()}
            basketId={basketId}
            onNameChange={handleNameChange}
          />

          {/* Show pending changes banner if any */}
          {pendingChanges.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-orange-900">
                    {pendingChanges.length} updated understanding{pendingChanges.length !== 1 ? 's' : ''} pending review
                  </h3>
                  <p className="text-xs text-orange-700">
                    Review changes in the Thinking Partner panel →
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basket Details */}
          {currentIntelligence && (
            <ContentInventorySection
              inventory={createInventoryFromIntelligence(currentIntelligence)}
            />
          )}

          {/* Executive Summary - Always show for honest assessment */}
          <NarrativeUnderstanding
            userThinkingPatterns={transformedData.narrative.userThinkingPatterns}
            dominantThemes={transformedData.narrative.dominantThemes}
            uncertainty={transformedData.narrative.uncertainty}
            readinessForExecution={transformedData.narrative.readinessForExecution}
            personalizedInsight={transformedData.narrative.personalizedInsight}
            confidenceLevel={transformedData.narrative.confidenceLevel}
          />

          {/* Context Suggestions */}
          <ContextSuggestions
            suggestions={transformedData.suggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </div>
      </div>

      {/* Universal Change Modal */}
      <UniversalChangeModal
        isOpen={pendingChanges.length > 0}
        changes={pendingChanges.length > 0 ? pendingChanges[0] : null}
        context={{ page: 'dashboard' }}
        onApprove={(selectedSections) => {
          if (pendingChanges.length > 0) {
            approveChanges(pendingChanges[0].id, selectedSections);
          }
          // Conversation context cleanup handled by unified hook
        }}
        onReject={(reason) => {
          if (pendingChanges.length > 0) {
            rejectChanges(pendingChanges[0].id, reason);
          }
          // Conversation context cleanup handled by unified hook
        }}
        onClose={() => {
          // Modal closes automatically when pendingChanges becomes empty
          // Conversation context cleanup handled by unified hook
          console.log('Change modal closed');
        }}
        currentIntelligence={currentIntelligence}
        isProcessing={isProcessing}
        conversationContext={conversationContext}
      />

      {/* Floating Communication Interface */}
      <FloatingCommunication
        onCapture={handleContextCapture}
        isProcessing={isProcessing}
        hasPendingChanges={pendingChanges.length > 0}
        onCheckPendingChanges={handleCheckPendingChanges}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

// Helper functions (reused from original ConsciousnessDashboard)
function transformToConsciousnessData(intelligence: any) {
  console.log('🔍 transformToConsciousnessData received:', {
    hasContextUnderstanding: !!intelligence.contextUnderstanding,
    hasIntelligence: !!intelligence.intelligence,
    intelligenceKeys: Object.keys(intelligence),
    contextKeys: intelligence.contextUnderstanding ? Object.keys(intelligence.contextUnderstanding) : []
  });

  const themes = intelligence.contextUnderstanding?.themes || [];
  const insights = intelligence.intelligence?.insights || [];
  const recommendations = intelligence.intelligence?.recommendations || [];
  
  const getStatus = (): 'evolving' | 'exploring' | 'developing' | 'established' => {
    const contextQuality = intelligence.substrateHealth?.contextQuality || 0;
    const recentActivity = intelligence.intelligence?.recentActivity?.length || 0;
    
    if (contextQuality > 0.7 && recentActivity > 2) return 'established';
    if (contextQuality > 0.5) return 'developing';
    if (contextQuality > 0.3 || recentActivity > 0) return 'evolving';
    return 'exploring';
  };

  const generateExecutiveSummary = () => {
    const documents = intelligence.documents || [];
    const insights = intelligence.intelligence?.insights || [];
    const recommendations = intelligence.intelligence?.recommendations || [];
    const contextQuality = intelligence.substrateHealth?.contextQuality || 0;
    const totalWords = calculateRealWordCount(intelligence);
    
    // Honest assessment for insufficient content
    if (themes.length === 0 && documents.length === 0 && totalWords < 100) {
      return "This workspace currently contains insufficient content for executive analysis. Add strategic documents, project plans, or contextual information to enable comprehensive intelligence reporting.";
    }
    
    if (themes.length === 0 && totalWords < 200) {
      return `This workspace contains ${totalWords} words across ${documents.length} document${documents.length !== 1 ? 's' : ''}, but lacks sufficient thematic content for strategic analysis. Consider adding more substantial business context, strategic objectives, or project documentation to enable meaningful intelligence insights.`;
    }

    // Generate comprehensive executive summary for substantial content
    let summary = '';
    
    // Opening paragraph - overall context and scope
    if (themes.length > 0 && totalWords >= 200) {
      const documentCount = documents.length;
      const themeList = themes.length > 2 
        ? `${themes.slice(0, 2).join(', ')}, and ${themes.length - 2} other strategic area${themes.length > 3 ? 's' : ''}`
        : themes.join(' and ');
      
      summary += `This workspace encompasses ${totalWords.toLocaleString()} words of strategic content across ${documentCount} document${documentCount !== 1 ? 's' : ''}, with primary focus on ${themeList}. `;
      
      if (contextQuality > 0.6) {
        summary += `The content demonstrates strong thematic coherence and strategic alignment, indicating well-developed thinking around these core areas.`;
      } else if (contextQuality > 0.3) {
        summary += `The content shows emerging patterns and developing strategic direction, with opportunities for deeper thematic integration.`;
      } else {
        summary += `The content represents early-stage exploration with foundational concepts that require further development and strategic focus.`;
      }
    }
    
    // Second paragraph - key insights and intelligence findings
    if (insights.length > 0 || recommendations.length > 0) {
      summary += `\n\nIntelligence analysis reveals ${insights.length} key insight${insights.length !== 1 ? 's' : ''} and ${recommendations.length} strategic recommendation${recommendations.length !== 1 ? 's' : ''}. `;
      
      if (insights.length > 0) {
        const topInsight = insights[0];
        summary += `Primary intelligence indicates ${topInsight.title?.toLowerCase() || 'strategic opportunities'} with ${Math.round((topInsight.confidence || 0.5) * 100)}% confidence level. `;
      }
      
      if (recommendations.length > 0) {
        const highPriorityRecs = recommendations.filter((r: any) => r.priority === 'high').length;
        if (highPriorityRecs > 0) {
          summary += `${highPriorityRecs} high-priority recommendation${highPriorityRecs !== 1 ? 's require' : ' requires'} immediate strategic attention.`;
        } else {
          summary += `Strategic recommendations focus on content expansion and thematic development to enhance intelligence capabilities.`;
        }
      }
    }
    
    // Third paragraph - readiness assessment and next steps
    const readinessLevel = contextQuality > 0.6 ? 'advanced' : contextQuality > 0.3 ? 'intermediate' : 'foundational';
    summary += `\n\nStrategic readiness assessment indicates ${readinessLevel} capability for business intelligence operations. `;
    
    if (contextQuality > 0.6) {
      summary += `The workspace demonstrates sufficient depth and coherence for advanced strategic synthesis, framework development, and executive decision support. Recommend proceeding with high-level strategic document creation and insight implementation.`;
    } else if (contextQuality > 0.3) {
      summary += `The workspace shows solid foundation with capacity for strategic document development and pattern analysis. Recommend expanding thematic content and developing clearer strategic frameworks to enable advanced intelligence capabilities.`;
    } else {
      summary += `The workspace requires significant content expansion and strategic focus development. Priority should be placed on adding comprehensive business context, strategic objectives, and substantive project documentation before attempting advanced intelligence operations.`;
    }
    
    console.log('🔍 generateExecutiveSummary returning:', summary.substring(0, 100));
    return summary;
  };

  const generateSuggestions = () => {
    const suggestions = [];
    const contextQuality = intelligence.substrateHealth?.contextQuality || 0;
    
    if (contextQuality > 0.5 && themes.length > 0) {
      suggestions.push({
        type: 'document_creation' as const,
        title: `Create a "${themes[0]} Framework" document`,
        reasoning: `Your ${themes[0].toLowerCase()} thinking is ready to be structured`,
        preview: `# ${themes[0]} Framework\n\n## Current Understanding\n[Your insights about ${themes[0].toLowerCase()}]\n\n## Key Principles\n[Core principles emerging from your thinking]\n\n## Implementation Approach\n[How to apply these insights]\n\n## Next Steps\n[Immediate actions to take]`,
        confidence: Math.min(contextQuality + 0.2, 0.95)
      });
    }

    if (themes.length > 1) {
      suggestions.push({
        type: 'analysis' as const,
        title: 'Develop strategic trade-off analysis',
        reasoning: 'Bridge your insights across different areas to identify strategic priorities',
        preview: `Analysis comparing ${themes.join(', ')} to help identify the most impactful focus areas and potential trade-offs between different strategic approaches.`,
        confidence: Math.min(contextQuality + 0.1, 0.9)
      });
    }

    if (contextQuality < 0.4) {
      suggestions.push({
        type: 'framework' as const,
        title: 'Start a thinking framework',
        reasoning: 'Establish a structured approach to capture and develop your ideas',
        preview: `A personalized framework to help you think through challenges, capture insights, and develop actionable strategies based on your unique approach.`,
        confidence: 0.7
      });
    }

    return suggestions;
  };

  return {
    suggestedName: themes.length > 0 ? `Exploring ${themes[0].toLowerCase()} decisions` : undefined,
    status: getStatus(),
    substrate: {
      rawDumps: intelligence.intelligence?.recentActivity?.length || 0,
      contextItems: insights.length,
      blocks: recommendations.length,
      totalWords: calculateRealWordCount(intelligence),
      patternsDetected: themes.length,
      readinessLevel: intelligence.substrateHealth?.contextQuality > 0.6 
        ? 'Ready for strategic document creation'
        : intelligence.substrateHealth?.contextQuality > 0.3
        ? 'Ready for pattern detection'
        : 'Needs more content'
    },
    narrative: {
      userThinkingPatterns: [
        ...insights.map((insight: any) => `${insight.title}: ${insight.description}`),
        ...recommendations.map((rec: any) => `Considering: ${rec.title}`)
      ],
      dominantThemes: themes,
      uncertainty: recommendations
        .filter((rec: any) => rec.priority === 'high')
        .map((rec: any) => rec.title),
      readinessForExecution: intelligence.substrateHealth?.contextQuality > 0.6,
      personalizedInsight: generateExecutiveSummary(), // Always generate fresh, ignore stored intent
      confidenceLevel: intelligence.substrateHealth?.contextQuality || 0.3
    },
    suggestions: generateSuggestions()
  };
}

function createInventoryFromIntelligence(intelligence: any) {
  // Calculate real document statistics
  const documents = intelligence.documents || [];
  const documentStats = {
    total: documents.length,
    withContent: 0,
    totalWords: 0,
    averageWords: 0
  };
  
  // Count documents with content and calculate word counts
  documents.forEach((doc: any) => {
    if (doc.content_raw && typeof doc.content_raw === 'string' && doc.content_raw.trim().length > 0) {
      documentStats.withContent++;
      const wordCount = doc.content_raw.split(/\s+/).filter((word: string) => word.length > 0).length;
      documentStats.totalWords += wordCount;
    }
  });
  
  documentStats.averageWords = documentStats.withContent > 0 
    ? Math.floor(documentStats.totalWords / documentStats.withContent)
    : 0;

  // Calculate insights and recommendations word counts (these might be "raw dumps")
  let insightsWords = 0;
  if (intelligence.intelligence?.insights) {
    insightsWords = intelligence.intelligence.insights.reduce((sum: number, insight: any) => {
      if (insight.description && typeof insight.description === 'string') {
        return sum + insight.description.split(/\s+/).filter((word: string) => word.length > 0).length;
      }
      return sum;
    }, 0);
  }

  let recommendationsWords = 0;
  if (intelligence.intelligence?.recommendations) {
    recommendationsWords = intelligence.intelligence.recommendations.reduce((sum: number, rec: any) => {
      if (rec.description && typeof rec.description === 'string') {
        return sum + rec.description.split(/\s+/).filter((word: string) => word.length > 0).length;
      }
      return sum;
    }, 0);
  }

  const rawDumpWords = insightsWords + recommendationsWords;

  return {
    documents: documentStats,
    rawDumps: {
      total: (intelligence.intelligence?.insights?.length || 0) + (intelligence.intelligence?.recommendations?.length || 0),
      processed: (intelligence.intelligence?.insights?.length || 0) + (intelligence.intelligence?.recommendations?.length || 0),
      totalWords: rawDumpWords,
      contentBreakdown: rawDumpWords > 0 ? {
        'insights': insightsWords,
        'recommendations': recommendationsWords
      } : {
        'insights': 0,
        'recommendations': 0
      }
    },
    contextItems: {
      total: intelligence.intelligence?.contextAlerts?.length || 0
    },
    blocks: {
      total: intelligence.documents?.length || 0
    }
  };
}

function calculateRealWordCount(intelligence: any): number {
  let totalWords = 0;
  
  // Count words from documents if available
  if (intelligence.documents && Array.isArray(intelligence.documents)) {
    totalWords += intelligence.documents.reduce((sum: number, doc: any) => {
      if (doc.content_raw && typeof doc.content_raw === 'string') {
        return sum + doc.content_raw.split(/\s+/).filter((word: string) => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  // Count words from insights descriptions
  if (intelligence.intelligence?.insights && Array.isArray(intelligence.intelligence.insights)) {
    totalWords += intelligence.intelligence.insights.reduce((sum: number, insight: any) => {
      if (insight.description && typeof insight.description === 'string') {
        return sum + insight.description.split(/\s+/).filter((word: string) => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  // Count words from recommendations
  if (intelligence.intelligence?.recommendations && Array.isArray(intelligence.intelligence.recommendations)) {
    totalWords += intelligence.intelligence.recommendations.reduce((sum: number, rec: any) => {
      if (rec.description && typeof rec.description === 'string') {
        return sum + rec.description.split(/\s+/).filter((word: string) => word.length > 0).length;
      }
      return sum;
    }, 0);
  }
  
  return totalWords;
}

function getDefaultTransformedData() {
  return {
    suggestedName: undefined,
    status: 'exploring' as const,
    substrate: {
      rawDumps: 0,
      contextItems: 0,
      blocks: 0,
      totalWords: 0,
      patternsDetected: 0,
      readinessLevel: 'Needs more content'
    },
    narrative: {
      userThinkingPatterns: [],
      dominantThemes: [],
      uncertainty: [],
      readinessForExecution: false,
      personalizedInsight: "This workspace currently contains insufficient content for executive analysis. Add strategic documents, project plans, or contextual information to enable comprehensive intelligence reporting.",
      confidenceLevel: 0.1
    },
    suggestions: []
  };
}