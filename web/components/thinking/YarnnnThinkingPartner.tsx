"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Send, Sparkles, Brain, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { usePageContext } from '@/lib/intelligence/pageContextDetection';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import { cn } from '@/lib/utils';

interface YarnnnThinkingPartnerProps {
  basketId: string;
  className?: string;
  onCapture?: (params: any) => void; // Keep for backward compatibility
}

export function YarnnnThinkingPartner({ 
  basketId,
  className = '',
  onCapture
}: YarnnnThinkingPartnerProps) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState<Date | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // ✅ CANON: Context awareness - knows where user is and what they see
  const context = usePageContext(basketId);
  
  // ✅ CANON: Universal changes integration - single pipeline for all changes
  const changeManager = useUniversalChanges(basketId);
  
  // Track pending changes specific to thinking partner
  const pendingIntelligence = changeManager.pendingChanges?.filter(
    change => change.type === 'intelligence_generate' || 
              change.type === 'intelligence_approve' ||
              change.type === 'intelligence_reject'
  ) || [];

  // Clear feedback after delay
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // ✅ CANON: Context-aware prompt based on current location
  const getContextualPrompt = useCallback(() => {
    if (!context) return "Loading context...";
    
    switch (context.page) {
      case 'document':
        return "I can help analyze this document, suggest improvements, or find connections to other documents.";
      case 'timeline':
        return "I can identify patterns in your research evolution and highlight key turning points.";
      case 'detailed-view':
        return "I can provide technical analysis of your substrate health and memory patterns.";
      default:
        return "Ask me about patterns, insights, or connections in your research. I see what you see.";
    }
  }, [context?.page]);

  // ✅ CANON: Generate intelligence WITH full context
  const generateIntelligence = useCallback(async () => {
    if (!input.trim()) {
      setFeedback({ message: 'Please enter a question or request', type: 'error' });
      return;
    }
    
    setIsGenerating(true);
    setFeedback(null);
    
    try {
      // Build comprehensive context package
      const contextPackage = {
        page: context?.page || 'unknown',
        userActivity: context?.userActivity || {},
        confidence: context?.confidence || 0,
        content: context?.content || {},
        timestamp: context?.timestamp || Date.now(),
        visibleContent: {
          route: typeof window !== 'undefined' ? window.location.pathname : '',
          search: typeof window !== 'undefined' ? window.location.search : '',
          hash: typeof window !== 'undefined' ? window.location.hash : ''
        }
      };
      
      // ✅ CANON: Call intelligence generation endpoint with full context
      const response = await fetch(`/api/intelligence/generate/${basketId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: input,
          context: contextPackage,
          requestType: 'thinking_partner_contextual',
          options: {
            includePatternAnalysis: true,
            includeMemoryConnections: true,
            includeActionableInsights: true,
            maxInsights: 5
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate intelligence');
      }

      const result = await response.json();
      
      // ✅ CANON: Use Universal Changes to handle intelligence generation
      if (result.insights && result.insights.length > 0) {
        // Create intelligence generation change
        await changeManager.generateIntelligence({
          insights: result.insights,
          context: contextPackage,
          prompt: input,
          source: 'thinking_partner'
        });
        
        setFeedback({
          message: `Generated ${result.insights.length} insight${result.insights.length !== 1 ? 's' : ''} for review`,
          type: 'success'
        });
        
        // Clear input after successful generation
        setInput('');
        setLastGenerationTime(new Date());
        
      } else if (result.message) {
        // Agent provided a direct response without structured insights
        setFeedback({ message: result.message, type: 'info' });
      } else {
        setFeedback({ message: 'No new insights generated. Try rephrasing your question.', type: 'info' });
      }
      
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
      setFeedback({
        message: error instanceof Error ? error.message : 'Failed to generate insights',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [input, basketId, context, changeManager]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      generateIntelligence();
    }
  }, [generateIntelligence]);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Backward compatibility: if parent provides onCapture, call it
  useEffect(() => {
    if (onCapture && pendingIntelligence.length > 0) {
      onCapture({
        type: 'intelligence_generated',
        changes: pendingIntelligence
      });
    }
  }, [pendingIntelligence, onCapture]);

  return (
    <div className={cn("w-full bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-gray-900">Thinking Partner</span>
          {pendingIntelligence.length > 0 && (
            <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
              {pendingIntelligence.length} pending
            </Badge>
          )}
        </div>
        {context && (
          <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200">
            {context.page} context
          </Badge>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {/* Context description */}
        <p className="text-sm text-gray-600">
          {getContextualPrompt()}
        </p>

        {/* Feedback messages */}
        {feedback && (
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg border",
            feedback.type === 'success' && "bg-green-50 border-green-200 text-green-800",
            feedback.type === 'error' && "bg-red-50 border-red-200 text-red-800",
            feedback.type === 'info' && "bg-blue-50 border-blue-200 text-blue-800"
          )}>
            <span className="text-sm">{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about patterns, request analysis, or explore connections..."
            className="w-full min-h-[120px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isGenerating}
            onKeyDown={handleKeyDown}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded border">
                {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
              </kbd>
              <span>to send</span>
            </div>
            
            <Button
              onClick={generateIntelligence}
              disabled={!input.trim() || isGenerating}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Context awareness indicator */}
        {context && context.confidence > 0 && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-gray-600">
              Context confidence: {Math.round(context.confidence * 100)}%
              {context.page === 'document' && ` • Analyzing document`}
              {context.userActivity?.recentEdits && ` • Tracking ${context.userActivity.recentEdits.length} recent edits`}
            </span>
          </div>
        )}
        
        {/* Last generation indicator */}
        {lastGenerationTime && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="h-3 w-3" />
            <span>
              Last insights generated {new Date().getTime() - lastGenerationTime.getTime() < 60000 
                ? 'just now' 
                : `${Math.floor((new Date().getTime() - lastGenerationTime.getTime()) / 60000)} minutes ago`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}