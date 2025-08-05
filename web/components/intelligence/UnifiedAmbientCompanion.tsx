"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Sparkles, ChevronUp, ChevronDown, MessageCircle, Lightbulb, ArrowRight, History, Zap } from 'lucide-react';
import { usePageContext, generateAmbientMessage, getContextCapabilities, type PageContext } from '@/lib/intelligence/pageContextDetection';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import { useUnifiedIntelligence } from '@/lib/intelligence/useUnifiedIntelligence';
import { analyzeConversationIntent, createConversationGenerationRequest } from '@/lib/intelligence/conversationAnalyzer';
import { createContextualConversationRequest } from '@/lib/intelligence/contextualIntelligence';
import { useBehavioralTriggers } from '@/lib/intelligence/behavioralTriggers';
import { useCrossPageSynthesis, generateSynthesisMessage, enhancePromptWithSynthesis } from '@/lib/intelligence/crossPageSynthesis';
import { useConversationThreading } from '@/lib/intelligence/conversationThreading';
import { AdaptiveConversationRouter, RouteEnhancementProcessor, type RoutingContext } from '@/lib/intelligence/adaptiveRouting';
import { crossPageExperienceManager, type CrossPageExperience } from '@/lib/intelligence/crossPageExperience';
import { enhancedPageIntelligenceAnalyzer, type EnhancedPageIntelligence } from '@/lib/intelligence/enhancedPageIntelligence';
import { mobileManager, useMobilePosition, useTouchGestures, useKeyboardAwarePosition, type TouchGesture } from '@/lib/intelligence/mobileOptimizations';

interface UnifiedAmbientCompanionProps {
  basketId: string;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  // Enhanced props for cross-page consistency
  persistentState?: boolean;
  transitionEnabled?: boolean;
  responsiveBreakpoint?: number;
}

type CompanionState = 'collapsed' | 'ambient' | 'expanded' | 'minimized';

export function UnifiedAmbientCompanion({ 
  basketId, 
  onExpandedChange,
  className = '',
  persistentState = true,
  transitionEnabled = true,
  responsiveBreakpoint = 768
}: UnifiedAmbientCompanionProps) {
  const [companionState, setCompanionState] = useState<CompanionState>('collapsed');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [quickInput, setQuickInput] = useState('');
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [crossPageExperience, setCrossPageExperience] = useState<CrossPageExperience | null>(null);
  const [enhancedIntelligence, setEnhancedIntelligence] = useState<EnhancedPageIntelligence | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartPoint, setTouchStartPoint] = useState<{ x: number; y: number } | null>(null);
  
  const companionRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const previousPageRef = useRef<string>('');

  // Mobile optimizations
  const companionSize = { 
    width: companionState === 'expanded' ? (isMobile ? 288 : 320) : 280, 
    height: companionState === 'expanded' ? (isMobile ? 320 : 400) : 200 
  };
  
  const { position: mobilePosition, mobileContext } = useMobilePosition(companionSize, companionState);
  const keyboardAwarePosition = useKeyboardAwarePosition(mobilePosition, companionSize.height);
  
  // Get page context and intelligence state
  const pageContext = usePageContext(basketId);
  
  // Universal Changes for primary change management
  const changeManager = useUniversalChanges(basketId);
  
  // Legacy unified intelligence for substrate data (temporary)
  const {
    currentIntelligence,
    conversationContext
  } = useUnifiedIntelligence(basketId);
  
  // Use Universal Changes for operations
  const pendingChanges = changeManager.pendingChanges;
  const isProcessing = changeManager.isProcessing;
  const generateIntelligence = changeManager.generateIntelligence;
  const addContext = changeManager.addContext;

  // Initialize synthesis context first
  const { synthesisContext, recordInteraction, getContextualRecommendations, hasSynthesisOpportunities } = useCrossPageSynthesis(
    pageContext,
    null,
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

  // Touch gesture handling
  const { handleTouchStart, handleTouchEnd } = useTouchGestures((gesture: TouchGesture) => {
    return mobileManager.handleCompanionGesture(
      gesture,
      companionState,
      (newState) => {
        setCompanionState(newState);
        onExpandedChange?.(newState === 'expanded');
        crossPageExperienceManager.updateCompanionState(newState);
      },
      (delta) => {
        // Handle drag repositioning
        setPosition(prev => ({
          x: Math.max(0, Math.min(window.innerWidth - companionSize.width, prev.x + delta.x)),
          y: Math.max(0, Math.min(window.innerHeight - companionSize.height, prev.y + delta.y))
        }));
        
        crossPageExperienceManager.updateCompanionPosition(
          { x: position.x + delta.x, y: position.y + delta.y },
          pageContext.page,
          true,
          'User gesture repositioning'
        );
      }
    );
  });

  // Responsive design detection with mobile context
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < responsiveBreakpoint;
      setIsMobile(isMobileDevice);
      
      // Update position based on mobile context
      if (isMobileDevice && mobileContext) {
        const optimalPos = mobileManager.getOptimalMobilePosition(companionSize, companionState);
        setPosition(optimalPos);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [responsiveBreakpoint, mobileContext, companionSize, companionState]);

  // Cross-page experience management
  useEffect(() => {
    const handlePageTransition = () => {
      const currentPage = pageContext.page;
      const previousPage = previousPageRef.current;
      
      if (previousPage && previousPage !== currentPage && currentPage !== 'unknown') {
        setIsTransitioning(true);
        
        // Handle transition with experience manager
        const transitionResult = crossPageExperienceManager.transitionToPage(
          previousPage,
          currentPage,
          {
            reason: 'navigation',
            preserveContext: persistentState,
            activeThread: activeThread || undefined,
            behavioralContext,
            synthesisContext
          }
        );

        // Update cross-page experience state
        setCrossPageExperience(crossPageExperienceManager.getExperience());

        // Apply visual transition
        if (transitionEnabled) {
          applyVisualTransition(transitionResult.visualTransition);
        }

        // Update position based on page context with mobile awareness
        if (isMobile && mobileContext) {
          const mobileOptimalPos = mobileManager.getOptimalMobilePosition(companionSize, companionState);
          const keyboardAdjustedPos = mobileManager.getKeyboardAwarePosition(mobileOptimalPos, companionSize.height);
          setPosition(keyboardAdjustedPos);
        } else {
          const optimalPosition = crossPageExperienceManager.getOptimalPosition(
            pageContext,
            { width: window.innerWidth, height: window.innerHeight }
          );
          setPosition({ x: optimalPosition.x, y: optimalPosition.y });
        }

        setTimeout(() => setIsTransitioning(false), transitionResult.visualTransition.duration);
      }
      
      previousPageRef.current = currentPage;
    };

    handlePageTransition();
  }, [pageContext.page, activeThread, behavioralContext, synthesisContext, persistentState, transitionEnabled]);

  // Update behavioral continuity and enhanced intelligence
  useEffect(() => {
    if (behavioralContext && synthesisContext) {
      crossPageExperienceManager.updateBehavioralContinuity(behavioralContext, synthesisContext);
      setCrossPageExperience(crossPageExperienceManager.getExperience());
      
      // Generate enhanced page intelligence
      const enhanced = enhancedPageIntelligenceAnalyzer.generatePageIntelligence(
        pageContext,
        behavioralContext,
        synthesisContext,
        conversationMemory,
        crossPageExperienceManager.getExperience()
      );
      setEnhancedIntelligence(enhanced);
    }
  }, [behavioralContext, synthesisContext, pageContext, conversationMemory]);

  // Determine companion state based on context and cross-page experience
  useEffect(() => {
    if (pageContext.page === 'unknown') {
      setCompanionState('minimized');
      return;
    }

    // Check for cross-page conversation continuity
    const continuity = crossPageExperienceManager.getConversationContinuity();
    if (continuity.hasActiveThread && transitionEnabled) {
      setCompanionState('ambient');
      return;
    }

    // Standard logic
    if (pageContext.userActivity.isActivelyEngaged) {
      setCompanionState('ambient');
    } else {
      setCompanionState('collapsed');
    }
  }, [pageContext.page, pageContext.userActivity.isActivelyEngaged, transitionEnabled]);

  // Enhanced ambient message with cross-page awareness
  const getEnhancedAmbientMessage = useCallback(() => {
    // Check for conversation continuity first
    const continuity = crossPageExperienceManager.getConversationContinuity();
    if (continuity.conversationBridge) {
      return continuity.conversationBridge;
    }

    // Check for active behavioral triggers
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

  // Handle companion click with cross-page awareness
  const handleCompanionClick = useCallback(() => {
    if (companionState === 'collapsed' || companionState === 'minimized') {
      setCompanionState('ambient');
    } else if (companionState === 'ambient') {
      setCompanionState('expanded');
      onExpandedChange?.(true);
      
      // Update experience manager
      crossPageExperienceManager.updateCompanionState('expanded');
    } else {
      setCompanionState('ambient');
      onExpandedChange?.(false);
      setShowCapabilities(false);
      setShowConversationHistory(false);
      
      // Update experience manager
      crossPageExperienceManager.updateCompanionState('ambient');
    }
  }, [companionState, onExpandedChange]);

  // Enhanced dragging with position memory
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
      
      // Update experience manager with user positioning
      crossPageExperienceManager.updateCompanionPosition(
        { x: newX, y: newY },
        pageContext.page,
        true,
        'User dragged companion'
      );
    }
  }, [isDragging, dragOffset, pageContext.page]);

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

  // Enhanced quick input submission with cross-page context
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
          hasSynthesis: hasSynthesisOpportunities(),
          crossPageContext: crossPageExperienceManager.getConversationContinuity()
        }
      });

      // Analyze conversation intent
      const intent = analyzeConversationIntent({
        userInput: quickInput.trim(),
        timestamp: new Date().toISOString()
      });

      // Create routing context with cross-page experience
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
      
      console.log('🎯 Cross-page adaptive routing:', {
        route: routingDecision.route,
        confidence: routingDecision.confidence,
        reasoning: routingDecision.reasoning,
        enhancements: routingDecision.enhancements.length,
        crossPageContext: !!crossPageExperience?.conversationContinuity.activeThread
      });

      if (routingDecision.route === 'simple_context_add') {
        // Simple context addition
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
            },
            crossPageContext: crossPageExperienceManager.getConversationContinuity()
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

        // Add cross-page context to query
        const continuity = crossPageExperienceManager.getConversationContinuity();
        if (continuity.contextualPrompt) {
          enhancedQuery += `\n\nCross-page context: ${continuity.contextualPrompt}`;
        }

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
              if (hasSynthesisOpportunities()) {
                enhancedQuery = enhancePromptWithSynthesis(enhancedQuery, synthesisContext, pageContext);
              }
          }
        }

        // Update contextual request with enhanced query and cross-page context
        contextualRequest = {
          ...contextualRequest,
          userQuery: enhancedQuery,
          routingDecision,
          threadContext: getThreadContext()
        };

        // Record intelligence request in thread
        const requestId = recordIntelligenceRequest(quickInput.trim());

        // Generate intelligence with cross-page adaptive routing
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
      console.error('Failed to process cross-page adaptive conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      recordOutcome('session_ended', { error: errorMessage }, 'low');
      addMessage('system_response', 'Sorry, I encountered an error processing your request');
    }
  };

  // Apply visual transition effects
  const applyVisualTransition = useCallback((config: any) => {
    if (!companionRef.current) return;

    const element = companionRef.current;
    element.style.transition = `all ${config.duration}ms ${config.easing}`;
    
    if (config.type === 'context_bridge') {
      element.style.transform = 'scale(1.05)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, config.duration / 2);
    }
  }, []);

  // Auto-position with responsive behavior
  useEffect(() => {
    const adjustPosition = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile positioning
      if (isMobile) {
        setPosition({
          x: width - 80, // Smaller margin for mobile
          y: height - 150 // Bottom area for mobile
        });
        return;
      }

      // Desktop positioning
      const maxX = width - (companionState === 'expanded' ? 320 : 280);
      const maxY = height - (companionState === 'expanded' ? 400 : 200);
      
      if (position.x > maxX || position.y > maxY) {
        const optimalPosition = crossPageExperienceManager.getOptimalPosition(
          pageContext,
          { width, height }
        );
        setPosition({ x: optimalPosition.x, y: optimalPosition.y });
      }
    };

    window.addEventListener('resize', adjustPosition);
    adjustPosition(); // Initial adjustment
    
    return () => window.removeEventListener('resize', adjustPosition);
  }, [position, companionState, pageContext, isMobile]);

  if (companionState === 'minimized') {
    return null;
  }

  // Get mobile-specific styles
  const mobileStyles = isMobile ? mobileManager.getMobileStyles('companion') : {};
  const touchButtonSize = isMobile ? mobileManager.getTouchButtonSize() : { width: 44, height: 44, fontSize: '14px' };

  return (
    <div
      ref={companionRef}
      className={`fixed z-40 transition-all duration-300 ease-out ${
        isDragging ? 'cursor-grabbing' : 'cursor-pointer'
      } ${isTransitioning ? 'opacity-75' : 'opacity-100'} ${className}`}
      style={{
        left: isMobile && mobileContext ? keyboardAwarePosition.x : position.x,
        top: isMobile && mobileContext ? keyboardAwarePosition.y : position.y,
        transform: companionState === 'collapsed' ? 'scale(0.9)' : 'scale(1)',
        ...mobileStyles
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="complementary"
      aria-label="Thinking Partner Assistant"
    >
      {/* Collapsed State */}
      {companionState === 'collapsed' && (
        <div
          className={`bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${
            isMobile ? 'w-14 h-14' : 'w-12 h-12'
          }`}
          style={{
            minWidth: touchButtonSize.width,
            minHeight: touchButtonSize.height
          }}
          onClick={handleCompanionClick}
          role="button"
          aria-label="Expand Thinking Partner"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCompanionClick()}
        >
          <Brain className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          {(pendingChanges.length > 0 || crossPageExperience?.conversationContinuity.activeThread) && (
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
          role="button"
          aria-label="Expand Thinking Partner details"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleCompanionClick()}
        >
          <div className="flex items-start gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              {isProcessing && (
                <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full animate-pulse opacity-20" />
              )}
              {(pendingChanges.length > 0 || crossPageExperience?.conversationContinuity.activeThread) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {isProcessing ? 'Processing your request...' : ambientMessage}
              </p>
              
              {/* Cross-page conversation indicator */}
              {crossPageExperience?.conversationContinuity.conversationBridge && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                  <ArrowRight className="h-3 w-3" />
                  <span>Cross-page context</span>
                </div>
              )}
              
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
          className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-6 max-h-96 overflow-hidden flex flex-col ${
            isMobile ? 'w-72' : 'w-80'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium text-gray-900">Thinking Partner</span>
              {crossPageExperience?.conversationContinuity.activeThread && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <History className="h-3 w-3" />
                  <span>Cross-page</span>
                </div>
              )}
            </div>
            <button
              onClick={handleCompanionClick}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Collapse Thinking Partner"
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
              {crossPageExperience?.conversationContinuity.activeThread && (
                <div title="Cross-page conversation active">
                  <Zap className="h-3 w-3 text-blue-500" />
                </div>
              )}
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
                placeholder={crossPageExperience?.conversationContinuity.conversationBridge 
                  ? "Continue conversation..." 
                  : "Ask me anything about your work..."
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Ask Thinking Partner"
              />
              <button
                type="submit"
                disabled={!quickInput.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-600 hover:text-purple-700 disabled:text-gray-400 transition-colors"
                aria-label="Send message"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Enhanced Capabilities */}
          <div className="space-y-2">
            {/* Enhanced Contextual Insights */}
            {enhancedIntelligence?.contextualInsights && enhancedIntelligence.contextualInsights.length > 0 && (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-700 mb-1">Page Intelligence</div>
                {enhancedIntelligence.contextualInsights.slice(0, 2).map((insight, index) => (
                  <div key={insight.id} className="flex items-start gap-2 text-xs text-blue-600 mb-1 last:mb-0">
                    <Zap className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{insight.title}: {insight.description.substring(0, 60)}...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Conversation History Toggle */}
            {crossPageExperience?.conversationContinuity.threadHistory && crossPageExperience.conversationContinuity.threadHistory.length > 0 && (
              <button
                onClick={() => setShowConversationHistory(!showConversationHistory)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Conversation History
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showConversationHistory ? 'rotate-180' : ''}`} />
              </button>
            )}

            {showConversationHistory && crossPageExperience?.conversationContinuity.threadHistory && (
              <div className="space-y-1 pl-6 border-l-2 border-blue-100">
                {crossPageExperience.conversationContinuity.threadHistory.slice(-3).map((thread, index) => (
                  <div key={thread.id} className="text-xs text-gray-600">
                    <span className="font-medium">{thread.pageContext.page}</span>: {thread.topic || 'Discussion'}
                  </div>
                ))}
              </div>
            )}

            {/* Capabilities Toggle */}
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