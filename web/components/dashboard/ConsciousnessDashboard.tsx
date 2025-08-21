"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedIntelligence } from '@/lib/intelligence/useUnifiedIntelligence';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import { IdentityAnchorHeader } from './IdentityAnchorHeader';
import { ContentInventorySection } from '@/components/detailed-view/ContentInventorySection';
import { ExecutiveSummary } from './ExecutiveSummary';
import { DashboardNextSteps } from './DashboardNextSteps';
import { YarnnnInsightApproval } from '@/components/thinking/YarnnnInsightApproval';
import { YarnnnThinkingPartner } from '@/components/thinking/YarnnnThinkingPartner';
import { PerfectIntegrationTest } from '@/components/test/PerfectIntegrationTest';
import { IntegrationDebugPanel } from '@/components/debug/IntegrationDebugPanel';
// Removed FloatingCompanion - using only YarnnnThinkingPartner
import { SimpleConnectionStatus, SimpleToast } from '@/components/ui/SimpleConnectionStatus';
import { YarnnnMemorySubstrate } from '@/components/thinking/YarnnnMemorySubstrate';
import { Brain, Sparkles, FileCheck } from 'lucide-react';
import OrganicSpinner from '@/components/ui/OrganicSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useBasket } from '@/contexts/BasketContext';
import { 
  analyzeConversationIntent, 
  createConversationGenerationRequest,
  type ConversationTriggeredGeneration 
} from '@/lib/intelligence/conversationAnalyzer';
import { useState as useToastState } from 'react';
import { useWorkspaceId } from '@/hooks/useWorkspaceId';

interface ConsciousnessDashboardProps {
  basketId: string;
}

export function ConsciousnessDashboard({ basketId }: ConsciousnessDashboardProps) {
  const router = useRouter();
  // Simple toast state - no complex toast system
  const [toast, setToast] = useToastState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  
  const showSuccess = (title: string, message: string) => {
    setToast({ message: `${title}: ${message}`, type: 'success' });
    setTimeout(() => setToast(null), 4000);
  };
  
  const showInfo = (title: string, message: string) => {
    setToast({ message: `${title}: ${message}`, type: 'info' });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Get basket data from context
  const { basket, updateBasketName } = useBasket();
  const [lastActive, setLastActive] = useState<string>(new Date().toISOString());
  useEffect(() => {
    fetch(`/api/baskets/${basketId}/state`)
      .then((r) => r.json())
      .then((d) => {
        if (d.last_activity_ts) setLastActive(d.last_activity_ts);
      })
      .catch(() => {});
  }, [basketId]);
  
  // Context OS state
  const workspaceId = useWorkspaceId(basketId);
  const substrate = useSubstrate(basketId, workspaceId || 'default');
  
  // Unified change management system
  const changeManager = useUniversalChanges(basketId);
  
  // Extract simplified state for UI
  const pendingChanges = changeManager.pendingChanges;
  const isProcessing = changeManager.isProcessing;
  const hasErrors = changeManager.hasErrors;
  const errors = changeManager.errors;
  
  // Legacy intelligence for substrate data (simplified access)
  const {
    currentIntelligence,
    conversationContext,
    setConversationContext,
    error,
    isInitialLoading
  } = useUnifiedIntelligence(basketId);
  
  // Substrate Evolution Verification Logging
  useEffect(() => {
    if (currentIntelligence) {
      const substrateState = {
        timestamp: new Date().toISOString(),
        documents: currentIntelligence.documents?.length || 0,
        insights: currentIntelligence.intelligence?.insights?.length || 0,
        recommendations: currentIntelligence.intelligence?.recommendations?.length || 0,
        contextAlerts: currentIntelligence.intelligence?.contextAlerts?.length || 0,
        themes: currentIntelligence.contextUnderstanding?.themes?.length || 0,
        coherenceScore: currentIntelligence.contextUnderstanding?.coherenceScore || 0,
        substrateHealth: currentIntelligence.substrateHealth?.evolutionRate || 'stable',
        pendingChanges: pendingChanges.length,
        wsConnected: changeManager.isConnected
      };
      
      // console.log('🔍 SUBSTRATE STATE:', substrateState);
    }
  }, [currentIntelligence, pendingChanges.length, changeManager.isConnected]);

  // Debug pending changes for modal
  useEffect(() => {
    console.log('🎯 Modal Debug:', { 
      pendingCount: changeManager.pendingChanges.length,
      isOpen: changeManager.pendingChanges.length > 0,
      changes: changeManager.pendingChanges
    });
  }, [changeManager.pendingChanges]);

  // Handle context capture from Yarnnn thinking partner
  const handleThoughtCapture = async (capturedContent: any) => {
    try {
      if (capturedContent.type === 'conversation') {
        // Use pre-analyzed intent from thinking partner
        const intent = capturedContent.intent;

        // Intelligence generation based on conversation intent
        
        if (intent.shouldGenerateIntelligence) {
          // Create conversation context and generate intelligence
          const conversationGenRequest = createConversationGenerationRequest(
            {
              userInput: capturedContent.content,
              timestamp: capturedContent.timestamp
            },
            intent
          );
          
          // Generate intelligence with conversation context - now through Universal Changes
          await changeManager.generateIntelligence(conversationGenRequest, 'conversation');
        } else {
          // For context addition or direct responses, use Universal Changes addContext
          await changeManager.addContext([{
            type: 'text',
            content: capturedContent.content,
            metadata: { 
              timestamp: capturedContent.timestamp,
              conversationIntent: intent.type,
              confidence: intent.confidence
            }
          }]);
          
          // Show warm, human feedback
          if (intent.type === 'context_addition') {
            showSuccess('Memory updated', 'I\'ll remember this for our future conversations');
          } else if (intent.type === 'direct_response') {
            showInfo('Thanks', 'I\'m here when you want to explore patterns or insights');
          } else if (intent.type === 'clarification') {
            showInfo('Got it', 'Let me know when you\'d like me to help you understand your work');
          }
          
          // Context added successfully
        }
        
      } else if (capturedContent.type === 'file') {
        // Handle file upload through unified context addition
        const formData = new FormData();
        formData.append('basketId', basketId);
        formData.append('files', capturedContent.file);
        
        console.log('✅ Step 1: File upload via Universal Changes pipeline');
        
        // Use Universal Changes pipeline for file uploads
        await changeManager.submitChange('context_add', {
          content: [{
            type: 'file',
            content: '', // File content will be processed by the service
            metadata: { 
              file: capturedContent.file,
              basketId,
              source: 'dashboard_file_upload'
            }
          }],
          triggerIntelligenceRefresh: true
        });
        
        console.log('✅ Step 2: File upload submitted through pipeline');
        showSuccess('Material added', 'Processing through Universal Changes pipeline');
        
      } else if (capturedContent.type === 'voice') {
        // Handle voice input
        await changeManager.addContext([{
          type: 'voice',
          content: capturedContent.content,
          metadata: { 
            timestamp: capturedContent.timestamp,
            duration: capturedContent.context?.duration,
            page: capturedContent.context?.page
          }
        }]);
        showSuccess('Voice captured', 'I heard your thoughts and will remember them');
        
      } else if (capturedContent.type === 'generate') {
        // Manual intelligence generation through Universal Changes
        await changeManager.generateIntelligence();
      }
      
    } catch (error) {
      console.error('Failed to process captured content:', error);
      setToast({ message: 'Something went wrong processing your thought', type: 'warning' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Handle checking pending insights - human language
  const handleCheckPendingInsights = () => {
    // The insight approval modal will automatically open when pendingChanges exist
    // This provides a warm way for users to review what I've discovered
  };

  // Handle "Begin" action from NextSteps - triggers FloatingCompanion
  const handleBeginAction = async (action: string) => {
    console.log('🎯 DASHBOARD ACTION:', action);
    console.log('🔍 BEFORE ACTION - Substrate state:', {
      documents: currentIntelligence?.documents?.length || 0,
      themes: currentIntelligence?.contextUnderstanding?.themes?.length || 0,
      insights: currentIntelligence?.intelligence?.insights?.length || 0,
      pendingChanges: pendingChanges.length
    });
    
    // Different actions trigger different behaviors in the FloatingCompanion
    switch (action) {
      case 'add-first-document':
        // Navigate directly to document creation for first-time users
        router.push(`/baskets/${basketId}/documents/new`);
        break;
        
      case 'build-substrate':
      case 'diversify-content':
        // Open companion with content-focused context
        // Content addition handled by YarnnnThinkingPartner - user can describe what they want to add
        console.log('📝 Content addition request - use YarnnnThinkingPartner');
        break;
        
      case 'process-content':
        // Trigger processing through changeManager
        console.log('⚡ GENERATING: Intelligence from dashboard');
        await changeManager.generateIntelligence();
        break;
        
      case 'review-insights':
        // This will be handled by the existing insight approval flow
        console.log('👁️ REVIEWING: Existing insights');
        break;
        
      case 'generate-insights':
        // Trigger insight generation
        console.log('⚡ GENERATING: Intelligence from dashboard');
        await changeManager.generateIntelligence();
        break;
        
      case 'explore-patterns':
        // Pattern exploration handled by YarnnnThinkingPartner
        console.log('🔍 Pattern exploration request - use YarnnnThinkingPartner');
        break;
        
      default:
        // All actions handled by YarnnnThinkingPartner
        console.log('⚡ Action request - use YarnnnThinkingPartner:', action);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'document_creation') {
      router.push(`/baskets/${basketId}/documents/new?suggestion=${encodeURIComponent(suggestion.title)}&preview=${encodeURIComponent(suggestion.preview)}`);
    } else if (suggestion.type === 'analysis') {
      router.push(`/baskets/${basketId}/detailed-view`);
    }
  };

  // Handle basket name change - now much simpler!
  const handleNameChange = async (newName: string) => {
    // The context handles all the API calls and state updates
    await updateBasketName(newName);
  };

  if (error || hasErrors) {
    return (
      <ErrorMessage 
        error={error || errors[0]?.message || 'Unknown error'} 
        onRetry={() => window.location.reload()}
        title="Failed to load thinking partner dashboard"
      />
    );
  }

  // Simplified loading state - only show for initial load
  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <OrganicSpinner size="lg" />
          <p className="text-lg text-gray-600 mt-6">Loading your workspace...</p>
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
  
  // Debug: log what data we're actually getting (disabled for production)
  // console.log('🔍 ConsciousnessDashboard Debug:', {
  //   hasCurrentIntelligence: !!currentIntelligence,
  //   personalizedInsight: transformedData.narrative.personalizedInsight?.substring(0, 100),
  //   intelligenceSource: currentIntelligence ? 'substrate' : 'default'
  // });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Main Dashboard Content - Clean, card-based layout */}
      <div className="w-full">
        <div className="container mx-auto py-6 space-y-6 max-w-4xl px-4">
          
          {/* Header with simple connection status and Context OS indicators */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <IdentityAnchorHeader
                basketName={basket?.name || 'Untitled Research'}
                suggestedName={transformedData.suggestedName}
                status={transformedData.status}
                lastActive={lastActive}
                basketId={basketId}
                onNameChange={handleNameChange}
              />
            </div>
            <div className="flex items-center space-x-3">
              {/* Context OS Proposed Blocks Badge */}
              {!substrate.loading && substrate.proposedBlocksCount > 0 && (
                <div className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <FileCheck className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    {substrate.proposedBlocksCount} block{substrate.proposedBlocksCount !== 1 ? 's' : ''} awaiting review
                  </span>
                </div>
              )}
              
              <SimpleConnectionStatus 
                isConnected={changeManager.isConnected}
                className=""
              />
            </div>
          </div>

          {/* Show pending insights banner with warm language */}
          {(pendingChanges.length > 0 || changeManager.pendingChanges.length > 0) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="text-sm font-medium text-orange-900">
                    I have new insights about your research
                  </h3>
                  <p className="text-xs text-orange-700 mt-1">
                    {Math.max(pendingChanges.length, changeManager.pendingChanges.length)} discovery{Math.max(pendingChanges.length, changeManager.pendingChanges.length) !== 1 ? 'ies' : 'y'} ready for you to review
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basket Details - Moved to 2nd position */}
          {currentIntelligence ? (
            <ContentInventorySection
              inventory={createInventoryFromIntelligence(currentIntelligence)}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <span className="text-4xl mb-3 block">📚</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content inventory</h3>
              <p className="text-gray-600">Add materials to see what you're working with</p>
            </div>
          )}

          {/* Executive Summary */}
          {(() => {
            const inventory = currentIntelligence ? createInventoryFromIntelligence(currentIntelligence) : null;
            const documentCount = inventory?.documents?.total || 0;
            const totalWords = (inventory?.documents?.totalWords || 0) + (inventory?.rawDumps?.totalWords || 0);
            
            return (
              <ExecutiveSummary
                intelligence={currentIntelligence}
                basketName={basket?.name || 'Your Research'}
                documentCount={documentCount}
                totalWords={totalWords}
              />
            );
          })()}

          {/* What You Could Do Next */}
          {(() => {
            const inventory = currentIntelligence ? createInventoryFromIntelligence(currentIntelligence) : null;
            const documentCount = inventory?.documents?.total || 0;
            const totalWords = (inventory?.documents?.totalWords || 0) + (inventory?.rawDumps?.totalWords || 0);
            
            return (
              <DashboardNextSteps
                documentCount={documentCount}
                totalWords={totalWords}
                hasProcessingQueue={(inventory?.rawDumps?.total || 0) > (inventory?.rawDumps?.processed || 0)}
                hasInsights={(pendingChanges.length > 0 || changeManager.pendingChanges.length > 0)}
                basketId={basketId}
                onBeginAction={handleBeginAction}
              />
            );
          })()}
          
          {/* PERFECT INTEGRATION TEST - TEMPORARY FOR DEBUGGING */}
          <div className="space-y-6">
            <PerfectIntegrationTest basketId={basketId} />
          </div>

          {/* Thinking Partner - Context-Aware Intelligence Generation */}
          <div className="space-y-6">
            <YarnnnThinkingPartner
              basketId={basketId}
              workspaceId={workspaceId || 'default'}
              className="max-w-2xl"
              onCapture={handleThoughtCapture}
            />
          </div>
        </div>
      </div>

      {/* Yarnnn Insight Approval - FORCED OPEN FOR TESTING */}
      <YarnnnInsightApproval
        isOpen={changeManager.pendingChanges.length > 0}
        
        // Universal changes support
        pendingChanges={changeManager.pendingChanges}
        changeManager={changeManager}
        
        context={{ page: 'dashboard' }}
        onClose={() => {
          // Modal closes automatically when pendingChanges becomes empty
          console.log('Insight approval closed');
        }}
        currentIntelligence={currentIntelligence}
        isProcessing={isProcessing || changeManager.isProcessing}
        conversationContext={conversationContext}
      />

      {/* FloatingCompanion removed - using only YarnnnThinkingPartner for consistency */}
      
      {/* Development Substrate Monitor */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 left-6 z-40 bg-black/90 text-white text-xs p-4 rounded-lg max-w-sm">
          <div className="font-bold mb-2">📊 Substrate Monitor</div>
          <div>Documents: {currentIntelligence?.documents?.length || 0}</div>
          <div>Themes: {currentIntelligence?.contextUnderstanding?.themes?.length || 0}</div>
          <div>Insights: {currentIntelligence?.intelligence?.insights?.length || 0}</div>
          <div>Recommendations: {currentIntelligence?.intelligence?.recommendations?.length || 0}</div>
          <div>Health: {currentIntelligence?.substrateHealth?.evolutionRate || 'unknown'}</div>
          <div>Pending Changes: {changeManager.pendingChanges.length}</div>
          <div>WebSocket: {changeManager.isConnected ? '🟢' : '🔴'}</div>
          <div>Processing: {changeManager.isProcessing ? '⚡' : '💤'}</div>
          
          <button 
            onClick={() => {
              console.log('🔍 CURRENT SUBSTRATE STATE:', {
                intelligence: currentIntelligence,
                pendingChanges,
                wsConnected: changeManager.isConnected,
                documents: currentIntelligence?.documents,
                errors: changeManager.errors
              });
            }}
            className="mt-2 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
          >
            Log Full State
          </button>
          
          <button 
            onClick={async () => {
              console.log('🧪 TESTING: Evolution verification');
              console.log('➕ CREATING: Test context via YarnnnThinkingPartner');
              // Test content creation handled by YarnnnThinkingPartner
            }}
            className="mt-1 px-2 py-1 bg-blue-500/50 rounded text-xs hover:bg-blue-500/70 transition-colors w-full"
          >
            Test Evolution
          </button>
        </div>
      )}

      {/* Simple toast notifications */}
      {toast && (
        <SimpleToast 
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* TEMPORARY DEBUG PANEL FOR INTEGRATION TESTING */}
      <IntegrationDebugPanel />
    </div>
  );
}

// Helper functions (reused from original ConsciousnessDashboard)
function transformToConsciousnessData(intelligence: any) {
  // Transform intelligence data for consciousness display

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
    
    // Honest assessment - no fake intelligence claims
    if (totalWords < 100) {
      return `This workspace contains ${totalWords} words across ${documents.length} item${documents.length !== 1 ? 's' : ''}. Insufficient content for executive analysis. Add strategic documents, project plans, or detailed notes to enable meaningful intelligence generation.`;
    }
    
    if (totalWords < 500) {
      return `This workspace contains ${totalWords} words across ${documents.length} document${documents.length !== 1 ? 's' : ''}. Content volume is too limited for comprehensive analysis. Add substantial strategic content, business context, or project documentation to enable reliable intelligence insights.`;
    }

    // Only generate analysis claims when there's actual content to support them
    let summary = `This workspace contains ${totalWords.toLocaleString()} words across ${documents.length} document${documents.length !== 1 ? 's' : ''}. `;
    
    if (themes.length > 0) {
      const themeList = themes.length > 2 
        ? `${themes.slice(0, 2).join(', ')}, and ${themes.length - 2} other theme${themes.length > 3 ? 's' : ''}`
        : themes.join(' and ');
      summary += `Identified themes include ${themeList}. `;
    } else {
      summary += `No clear thematic patterns have emerged yet. `;
    }
    
    // Only mention insights/recommendations if they actually exist and are substantive
    const substantiveInsights = insights.filter((i: any) => i.description && i.description.length > 50);
    const substantiveRecommendations = recommendations.filter((r: any) => r.description && r.description.length > 50);
    
    if (substantiveInsights.length > 0 || substantiveRecommendations.length > 0) {
      summary += `\n\nContent analysis generated ${substantiveInsights.length} insight${substantiveInsights.length !== 1 ? 's' : ''} and ${substantiveRecommendations.length} recommendation${substantiveRecommendations.length !== 1 ? 's' : ''} based on available material. `;
    } else {
      summary += `\n\nContent requires further development to generate substantive insights and strategic recommendations. `;
    }
    
    // Honest readiness assessment
    if (totalWords < 1000) {
      summary += `\n\nWorkspace readiness: Early stage. Add more comprehensive content to enable advanced intelligence capabilities.`;
    } else if (contextQuality > 0.6) {
      summary += `\n\nWorkspace readiness: Sufficient content for strategic analysis and document generation.`;
    } else {
      summary += `\n\nWorkspace readiness: Developing. Content volume adequate but thematic coherence needs strengthening.`;
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