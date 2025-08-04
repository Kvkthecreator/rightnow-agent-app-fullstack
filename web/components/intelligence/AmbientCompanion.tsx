"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Sparkles, ChevronUp, ChevronDown, MessageCircle, Lightbulb } from 'lucide-react';
import { usePageContext, generateAmbientMessage, getContextCapabilities, type PageContext } from '@/lib/intelligence/pageContextDetection';
import { useUnifiedIntelligence } from '@/lib/intelligence/useUnifiedIntelligence';
import { analyzeConversationIntent, createConversationGenerationRequest } from '@/lib/intelligence/conversationAnalyzer';
import { createContextualConversationRequest } from '@/lib/intelligence/contextualIntelligence';
import { useBehavioralTriggers } from '@/lib/intelligence/behavioralTriggers';
import { useCrossPageSynthesis, generateSynthesisMessage, enhancePromptWithSynthesis } from '@/lib/intelligence/crossPageSynthesis';
import { useConversationThreading } from '@/lib/intelligence/conversationThreading';
import { AdaptiveConversationRouter, RouteEnhancementProcessor, type RoutingContext } from '@/lib/intelligence/adaptiveRouting';

interface AmbientCompanionProps {
  basketId: string;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
}

type CompanionState = 'collapsed' | 'ambient' | 'expanded' | 'minimized';

export function AmbientCompanion({ 
  basketId, 
  onExpandedChange,
  className = '' 
}: AmbientCompanionProps) {
  const [companionState, setCompanionState] = useState<CompanionState>('collapsed');
  const [position, setPosition] = useState({ x: window.innerWidth - 280, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [quickInput, setQuickInput] = useState('');
  const [showCapabilities, setShowCapabilities] = useState(false);
  
  const companionRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Get page context and intelligence state
  const pageContext = usePageContext(basketId);
  const {
    currentIntelligence,
    pendingChanges,
    isProcessing,
    conversationContext,
    generateIntelligence,
    addContext
  } = useUnifiedIntelligence(basketId);

  // Initialize synthesis context first (without behavioral context)
  const { synthesisContext, recordInteraction, getContextualRecommendations, hasSynthesisOpportunities } = useCrossPageSynthesis(
    pageContext,
    null, // Initial pass without behavioral context
    currentIntelligence
  );

  // Get behavioral context with synthesis context
  const { behavioralContext, activeTriggers, recordInteraction: recordBehavioralInteraction, activateTrigger } = useBehavioralTriggers(
    pageContext,
    synthesisContext
  );

  // Conversation threading and adaptive routing
  const {
    activeThread,
    conversationMemory,
    addMessage,
    recordIntelligenceRequest,
    recordOutcome,
    getThreadContext
  } = useConversationThreading(pageContext, synthesisContext);

  const adaptiveRouter = useRef(new AdaptiveConversationRouter());

  // Determine initial state based on context
  useEffect(() => {
    if (pageContext.page === 'unknown') {
      setCompanionState('minimized');
    } else if (pageContext.userActivity.isActivelyEngaged) {
      setCompanionState('ambient');
    } else {
      setCompanionState('collapsed');
    }
  }, [pageContext.page, pageContext.userActivity.isActivelyEngaged]);

  // Generate enhanced ambient message with behavioral and synthesis awareness
  const getEnhancedAmbientMessage = useCallback(() => {
    // Check for active behavioral triggers first
    if (activeTriggers.length > 0) {
      const highestConfidenceTrigger = activeTriggers.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      return highestConfidenceTrigger.message(behavioralContext, pageContext);
    }

    // Check for synthesis opportunities
    const synthesisMessage = generateSynthesisMessage(synthesisContext, pageContext);
    if (synthesisMessage && hasSynthesisOpportunities()) {
      return synthesisMessage;
    }

    // Fallback to standard ambient message
    return generateAmbientMessage(pageContext, currentIntelligence);
  }, [activeTriggers, behavioralContext, pageContext, synthesisContext, hasSynthesisOpportunities, currentIntelligence]);

  const ambientMessage = getEnhancedAmbientMessage();
  const capabilities = getContextCapabilities(pageContext);
  const contextualRecommendations = getContextualRecommendations();

  // Handle companion click
  const handleCompanionClick = useCallback(() => {
    if (companionState === 'collapsed' || companionState === 'minimized') {
      setCompanionState('ambient');
    } else if (companionState === 'ambient') {
      setCompanionState('expanded');
      onExpandedChange?.(true);
    } else {
      setCompanionState('ambient');
      onExpandedChange?.(false);
      setShowCapabilities(false);
    }
  }, [companionState, onExpandedChange]);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === dragRef.current || dragRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      setIsDragging(true);
      
      const rect = companionRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
      
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle quick input submission with adaptive routing
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    try {
      // Record message in conversation thread
      addMessage('user_input', quickInput.trim());

      // Record interaction for cross-page synthesis
      recordInteraction({
        type: 'intelligence_request',
        content: quickInput.trim(),
        context: { 
          companionState,
          hasTriggers: activeTriggers.length > 0,
          hasSynthesis: hasSynthesisOpportunities()
        }
      });

      // Analyze conversation intent
      const intent = analyzeConversationIntent({
        userInput: quickInput.trim(),
        timestamp: new Date().toISOString()
      });

      // Create routing context
      const routingContext: RoutingContext = {
        userQuery: quickInput.trim(),
        intent,
        pageContext,
        behavioralContext,
        synthesisContext,
        conversationMemory,
        activeThread,
        activeTriggers
      };

      // Get adaptive routing decision
      const routingDecision = adaptiveRouter.current.routeConversation(routingContext);
      
      console.log('🎯 Adaptive routing decision:', {
        route: routingDecision.route,
        confidence: routingDecision.confidence,
        reasoning: routingDecision.reasoning,
        enhancements: routingDecision.enhancements.length
      });

      if (routingDecision.route === 'simple_context_add') {
        // Simple context addition - no intelligence generation
        await addContext([{
          type: 'text',
          content: quickInput.trim(),
          metadata: {
            timestamp: new Date().toISOString(),
            conversationIntent: intent.type,
            confidence: intent.confidence,
            pageContext: {
              page: pageContext.page,
              userActivity: pageContext.userActivity.lastAction,
              content: pageContext.content
            },
            routingDecision: {
              route: routingDecision.route,
              confidence: routingDecision.confidence
            }
          }
        }]);

        recordOutcome('context_added', quickInput.trim(), 'low');
        addMessage('system_response', 'Context added to your workspace');

      } else {
        // Intelligence generation with adaptive enhancements
        const conversationGenRequest = createConversationGenerationRequest(
          {
            userInput: quickInput.trim(),
            timestamp: new Date().toISOString()
          },
          intent
        );

        // Start with basic contextual request
        let contextualRequest = createContextualConversationRequest(
          conversationGenRequest,
          pageContext
        );

        // Apply route-specific enhancements
        let enhancedQuery = contextualRequest.userQuery;

        if (routingDecision.enhancements.length > 0) {
          switch (routingDecision.route) {
            case 'synthesis_generation':
              enhancedQuery = RouteEnhancementProcessor.processSynthesisEnhancements(
                routingDecision.enhancements,
                enhancedQuery
              );
              break;

            case 'behavioral_response':
              enhancedQuery = RouteEnhancementProcessor.processBehavioralEnhancements(
                routingDecision.enhancements,
                enhancedQuery
              );
              break;

            case 'memory_assisted':
              enhancedQuery = RouteEnhancementProcessor.processMemoryEnhancements(
                routingDecision.enhancements,
                enhancedQuery
              );
              break;

            case 'workflow_guidance':
              enhancedQuery = RouteEnhancementProcessor.processWorkflowEnhancements(
                routingDecision.enhancements,
                enhancedQuery
              );
              break;

            default:
              // For other routes, apply cross-page synthesis if available
              if (hasSynthesisOpportunities()) {
                enhancedQuery = enhancePromptWithSynthesis(enhancedQuery, synthesisContext, pageContext);
              }
          }
        }

        // Update contextual request with enhanced query
        contextualRequest = {
          ...contextualRequest,
          userQuery: enhancedQuery,
          routingDecision,
          threadContext: getThreadContext()
        };

        // Record intelligence request in thread
        const requestId = recordIntelligenceRequest(quickInput.trim());

        // Generate intelligence with adaptive routing
        await generateIntelligence(contextualRequest);

        // Record behavioral interaction
        recordBehavioralInteraction({
          type: 'proactive_suggestion',
          timestamp: Date.now(),
          userResponse: 'engaged',
          contextualRelevance: routingDecision.confidence,
          timingScore: activeTriggers.length > 0 ? 0.8 : 0.6
        });

        recordOutcome('intelligence_approved', { requestId, route: routingDecision.route }, 'high');
      }

      setQuickInput('');
      setCompanionState('ambient');

    } catch (error) {
      console.error('Failed to process adaptive conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      recordOutcome('session_ended', { error: errorMessage }, 'low');
      addMessage('system_response', 'Sorry, I encountered an error processing your request');
    }
  };

  // Auto-position to avoid overlapping with key content
  useEffect(() => {
    const adjustPosition = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Keep companion in visible area
      const maxX = width - (companionState === 'expanded' ? 320 : 280);
      const maxY = height - (companionState === 'expanded' ? 400 : 200);
      
      if (position.x > maxX || position.y > maxY) {
        setPosition({
          x: Math.min(position.x, maxX),
          y: Math.min(position.y, maxY)
        });
      }
    };

    window.addEventListener('resize', adjustPosition);
    return () => window.removeEventListener('resize', adjustPosition);
  }, [position, companionState]);

  if (companionState === 'minimized') {
    return null;
  }

  return (
    <div
      ref={companionRef}
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isDragging ? 'cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: companionState === 'collapsed' ? 'scale(0.8)' : 'scale(1)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Collapsed State */}
      {companionState === 'collapsed' && (
        <div
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          onClick={handleCompanionClick}
        >
          <Brain className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          {pendingChanges.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Ambient State */}
      {companionState === 'ambient' && (
        <div
          ref={dragRef}
          className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 p-4 max-w-sm"
          onClick={handleCompanionClick}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              {isProcessing && (
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-pulse opacity-20" />
              )}
              {pendingChanges.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {isProcessing ? 'Processing your request...' : ambientMessage}
              </p>
              
              {pageContext.userActivity.isActivelyEngaged && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Following along</span>
                </div>
              )}
            </div>

            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Expanded State */}
      {companionState === 'expanded' && (
        <div
          ref={dragRef}
          className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-80 max-h-96 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium text-gray-900">Thinking Partner</span>
            </div>
            <button
              onClick={handleCompanionClick}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Context Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {pageContext.page.replace('-', ' ')} Context
              </span>
              <div className={`w-2 h-2 rounded-full ${
                pageContext.userActivity.isActivelyEngaged ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {ambientMessage}
            </p>
          </div>

          {/* Quick Input */}
          <form onSubmit={handleQuickSubmit} className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Ask me anything about your work..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!quickInput.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-600 hover:text-purple-700 disabled:text-gray-400 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Enhanced Capabilities with Contextual Recommendations */}
          <div className="space-y-2">
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>What I can help with</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showCapabilities ? 'rotate-180' : ''}`} />
            </button>
            
            {showCapabilities && (
              <div className="space-y-2">
                {/* Contextual Recommendations */}
                {contextualRecommendations.length > 0 && (
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-xs font-medium text-purple-700 mb-1">Smart Recommendations</div>
                    {contextualRecommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-purple-600 mb-1 last:mb-0">
                        <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Triggers */}
                {activeTriggers.length > 0 && (
                  <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-xs font-medium text-orange-700 mb-1">Behavioral Insights</div>
                    {activeTriggers.slice(0, 2).map((trigger, index) => (
                      <div key={trigger.id} className="flex items-start gap-2 text-xs text-orange-600 mb-1 last:mb-0">
                        <MessageCircle className="h-3 w-3 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>{trigger.message(behavioralContext, pageContext)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Standard Capabilities */}
                <div className="space-y-1 pl-2 border-l-2 border-gray-100">
                  {capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <Lightbulb className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status indicators */}
          {(pendingChanges.length > 0 || isProcessing) && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{pendingChanges.length} insight{pendingChanges.length !== 1 ? 's' : ''} pending review</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <div className="w-3 h-3 border border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ambient positioning utility to avoid key content areas
 */
export function calculateOptimalPosition(
  pageContext: PageContext,
  windowDimensions: { width: number; height: number }
): { x: number; y: number } {
  const { width, height } = windowDimensions;
  const margin = 20;

  // Default position (top right)
  let x = width - 300 - margin;
  let y = margin + 60; // Account for header

  // Adjust based on page type
  switch (pageContext.page) {
    case 'dashboard':
      // Avoid main content area
      x = width - 280 - margin;
      y = 120;
      break;
      
    case 'document':
      // Position away from writing area
      x = width - 300 - margin;
      y = height / 3;
      break;
      
    case 'timeline':
      // Avoid timeline content
      x = margin;
      y = height / 2;
      break;
      
    case 'detailed-view':
      // Position away from analysis panels
      x = width - 320 - margin;
      y = 100;
      break;
  }

  // Ensure within bounds
  x = Math.max(margin, Math.min(x, width - 320 - margin));
  y = Math.max(margin, Math.min(y, height - 200 - margin));

  return { x, y };
}