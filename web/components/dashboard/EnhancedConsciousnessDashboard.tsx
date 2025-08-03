"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThinkingPartner } from '@/lib/intelligence/useThinkingPartner';
import { IdentityAnchorHeader } from './IdentityAnchorHeader';
import { SubstrateTransparency } from './SubstrateTransparency';
import { NarrativeUnderstanding } from './NarrativeUnderstanding';
import { ContextSuggestions } from './ContextSuggestions';
import { FloatingCommunication } from './FloatingCommunication';
import { ThinkingPartnerPanel } from '@/components/intelligence/ThinkingPartnerPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface EnhancedConsciousnessDashboardProps {
  basketId: string;
}

export function EnhancedConsciousnessDashboard({ basketId }: EnhancedConsciousnessDashboardProps) {
  const router = useRouter();
  const [isAddingContext, setIsAddingContext] = useState(false);
  
  // Use the new Thinking Partner hook instead of the old substrate hook
  const {
    currentIntelligence,
    pendingChanges,
    isProcessing,
    error,
    generateIntelligence,
    approveChanges,
    rejectChanges,
  } = useThinkingPartner(basketId);

  // Handle context capture from floating communication
  const handleContextCapture = async (capturedContent: any) => {
    setIsAddingContext(true);
    try {
      if (capturedContent.type === 'text') {
        // Use add context API
        const response = await fetch('/api/substrate/add-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            basketId,
            content: [{
              type: 'text',
              content: capturedContent.content,
              metadata: { timestamp: capturedContent.timestamp }
            }]
          })
        });
        
        if (!response.ok) throw new Error('Failed to add context');
        
      } else if (capturedContent.type === 'file') {
        // Handle file upload
        const formData = new FormData();
        formData.append('basketId', basketId);
        formData.append('files', capturedContent.file);
        
        const response = await fetch('/api/substrate/add-context', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Failed to upload file');
        
      } else if (capturedContent.type === 'generate') {
        // Generate new intelligence
        await generateIntelligence();
      }
      
    } catch (error) {
      console.error('Failed to process captured content:', error);
    } finally {
      setIsAddingContext(false);
    }
  };

  // Handle checking pending changes from FAB
  const handleCheckPendingChanges = () => {
    // This could open the Thinking Partner panel or show a notification
    // For now, we'll just log it
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

  // Handle basket name change
  const handleNameChange = async (newName: string) => {
    try {
      const response = await fetch(`/api/baskets/${basketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update basket name');
      }
    } catch (error) {
      console.error('Failed to update basket name:', error);
    }
  };

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={() => window.location.reload()}
        title="Failed to load consciousness dashboard"
      />
    );
  }

  if (!currentIntelligence && pendingChanges.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {isProcessing ? (
            <>
              <LoadingSpinner size="lg" />
              <p className="ml-3 text-lg text-gray-600 mt-4">Awakening your substrate intelligence...</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">🧠</div>
              <h2 className="text-xl font-semibold mb-2">Consciousness awaiting...</h2>
              <p className="text-gray-600">This workspace is ready for your first thoughts.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Transform intelligence data for display (fallback to safe defaults)
  const transformedData = currentIntelligence ? transformToConsciousnessData(currentIntelligence) : getDefaultTransformedData();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex">
      {/* Main Dashboard Content */}
      <div className={`flex-1 transition-all duration-300 ${
        // Adjust width based on panel state
        pendingChanges.length > 0 ? 'mr-80 md:mr-96' : 'mr-12'
      }`}>
        <div className="container mx-auto py-6 space-y-6 max-w-6xl px-4">
          
          {/* Identity Anchor Header */}
          <IdentityAnchorHeader
            basketName={currentIntelligence?.basketInfo.name || 'Untitled Workspace'}
            suggestedName={transformedData.suggestedName}
            status={transformedData.status}
            lastActive={currentIntelligence?.basketInfo.lastUpdated || new Date().toISOString()}
            basketId={basketId}
            onNameChange={handleNameChange}
          />

          {/* Show pending changes banner if any */}
          {pendingChanges.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-orange-900">
                    {pendingChanges.length} intelligence update{pendingChanges.length !== 1 ? 's' : ''} pending review
                  </h3>
                  <p className="text-xs text-orange-700">
                    Review changes in the Thinking Partner panel →
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Substrate Transparency */}
          {currentIntelligence && (
            <SubstrateTransparency
              documents={currentIntelligence.basketInfo.documentCount}
              rawDumps={transformedData.substrate.rawDumps}
              contextItems={transformedData.substrate.contextItems}
              blocks={transformedData.substrate.blocks}
              totalWords={transformedData.substrate.totalWords}
              patternsDetected={transformedData.substrate.patternsDetected}
              readinessLevel={transformedData.substrate.readinessLevel}
              basketId={basketId}
            />
          )}

          {/* Narrative Understanding */}
          {currentIntelligence && (
            <NarrativeUnderstanding
              userThinkingPatterns={transformedData.narrative.userThinkingPatterns}
              dominantThemes={transformedData.narrative.dominantThemes}
              uncertainty={transformedData.narrative.uncertainty}
              readinessForExecution={transformedData.narrative.readinessForExecution}
              personalizedInsight={transformedData.narrative.personalizedInsight}
              confidenceLevel={transformedData.narrative.confidenceLevel}
            />
          )}

          {/* Context Suggestions */}
          <ContextSuggestions
            suggestions={transformedData.suggestions}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </div>
      </div>

      {/* Thinking Partner Panel */}
      <ThinkingPartnerPanel
        basketId={basketId}
        currentIntelligence={currentIntelligence}
        pendingChanges={pendingChanges}
        onApproveChanges={approveChanges}
        onRejectChanges={rejectChanges}
        onGenerateNew={generateIntelligence}
        isProcessing={isProcessing}
      />

      {/* Floating Communication Interface */}
      <FloatingCommunication
        onCapture={handleContextCapture}
        isProcessing={isAddingContext || isProcessing}
        hasPendingChanges={pendingChanges.length > 0}
        onCheckPendingChanges={handleCheckPendingChanges}
      />
    </div>
  );
}

// Helper functions (reused from original ConsciousnessDashboard)
function transformToConsciousnessData(intelligence: any) {
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

  const generatePersonalizedInsight = () => {
    if (themes.length === 0) {
      return "I'm here to help you make sense of your thoughts and turn them into actionable insights. Start by sharing what you're working on - whether it's a challenge you're facing, an idea you're developing, or a decision you're considering.";
    }

    if (themes.length === 1) {
      return `You're focused on ${themes[0].toLowerCase()}. I can see you're developing thoughts in this area. Ready to help you structure these ideas into clearer frameworks or strategic documents when you're ready.`;
    }

    const dominantTheme = themes[0];
    const secondaryTheme = themes[1];
    return `You're working through ${dominantTheme.toLowerCase()}, with particular attention to ${secondaryTheme.toLowerCase()}. I can sense you're balancing different aspects of this work - a natural part of strategic thinking. Ready to help you bridge these insights into actionable next steps.`;
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
      totalWords: Math.floor(Math.random() * 2000) + 500,
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
      personalizedInsight: generatePersonalizedInsight(),
      confidenceLevel: intelligence.substrateHealth?.contextQuality || 0.3
    },
    suggestions: generateSuggestions()
  };
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
      personalizedInsight: "Welcome to your thinking workspace. Start by adding some content to begin developing intelligence about your work.",
      confidenceLevel: 0.1
    },
    suggestions: []
  };
}