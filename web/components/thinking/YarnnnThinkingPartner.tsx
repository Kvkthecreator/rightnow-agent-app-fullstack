"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AgentAttribution } from '@/components/ui/AgentAttribution';
import { Send, Sparkles, Brain, Loader2, AlertCircle, CheckCircle2, X, Cpu, Paperclip } from 'lucide-react';
import { usePageContext } from '@/lib/intelligence/pageContextDetection';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import { useSubstrate } from '@/lib/substrate/useSubstrate';
import { FileFragmentHandler } from '@/lib/substrate/FileFragmentHandler';
import { getFragmentType, type Fragment } from '@/lib/substrate/FragmentTypes';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

interface YarnnnThinkingPartnerProps {
  basketId: string;
  workspaceId: string;
  className?: string;
  mode?: 'substrate' | 'intelligence'; // substrate = unified input
  onCapture?: (params: any) => void; // Keep for backward compatibility
}

export function YarnnnThinkingPartner({ 
  basketId,
  workspaceId,
  className = '',
  mode = 'substrate',
  onCapture
}: YarnnnThinkingPartnerProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [lastGenerationTime, setLastGenerationTime] = useState<Date | null>(null);
  const [lastResponse, setLastResponse] = useState<{
    message: string;
    agentSource?: string;
    confidence?: number;
    timestamp: Date;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Substrate mode - unified input
  const substrate = useSubstrate(basketId, workspaceId);
  
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

  // Context-aware prompt based on mode and location
  const getContextualPrompt = useCallback(() => {
    if (!context) return "Loading context...";
    
    if (mode === 'substrate') {
      return "Share your thoughts, paste content, or add files...";
    }
    
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
  }, [context?.page, mode]);

  // ✅ CANON: Generate intelligence WITH full context
  const generateIntelligence = useCallback(async () => {
    if (!input.trim()) {
      setFeedback({ message: 'Please enter a question or request', type: 'error' });
      return;
    }
    
    setIsGenerating(true);
    setFeedback(null);
    setProcessingStep('Analyzing your input...');
    
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
      
      setProcessingStep('Connecting to Context OS agents...');
      
      // ✅ CANON: Call intelligence generation endpoint with full context
      const response = await apiClient.request(`/api/intelligence/generate/${basketId}`, {
        method: 'POST',
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

      if (!response || (response as any)?.error) {
        throw new Error((response as any)?.error || 'Failed to generate intelligence');
      }

      setProcessingStep('Processing agent response...');
      const result = response;
      
      // ✅ CANON: Use Universal Changes to handle intelligence generation
      if ((result as any).insights && (result as any).insights.length > 0) {
        // Create intelligence generation change
        await changeManager.generateIntelligence({
          insights: (result as any).insights,
          context: contextPackage,
          prompt: input,
          source: 'thinking_partner'
        });
        
        // Set response with agent attribution
        setLastResponse({
          message: `Generated ${(result as any).insights.length} insight${(result as any).insights.length !== 1 ? 's' : ''} for review`,
          agentSource: (result as any).metadata?.agent_source || 'Context OS Agent',
          confidence: (result as any).metadata?.confidence,
          timestamp: new Date()
        });
        
        setFeedback({
          message: `Generated ${(result as any).insights.length} insight${(result as any).insights.length !== 1 ? 's' : ''} for review`,
          type: 'success'
        });
        
        // Clear input after successful generation
        setInput('');
        setLastGenerationTime(new Date());
        
      } else if ((result as any).message) {
        // Agent provided a direct response without structured insights
        setLastResponse({
          message: (result as any).message,
          agentSource: (result as any).metadata?.agent_source || 'Context OS Agent',
          confidence: (result as any).metadata?.confidence,
          timestamp: new Date()
        });
        setFeedback({ message: (result as any).message, type: 'info' });
      } else {
        setLastResponse({
          message: 'No new insights generated. Try rephrasing your question.',
          agentSource: 'Context OS',
          timestamp: new Date()
        });
        setFeedback({ message: 'No new insights generated. Try rephrasing your question.', type: 'info' });
      }
      
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
      setLastResponse({
        message: error instanceof Error ? error.message : 'Failed to connect to Context OS agents',
        agentSource: 'System Error',
        timestamp: new Date()
      });
      setFeedback({
        message: error instanceof Error ? error.message : 'Failed to generate insights',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
    }
  }, [input, basketId, context, changeManager]);

  // SUBSTRATE MODE: Handle file attachments
  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const type = getFragmentType(file);
      return type !== null;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // SUBSTRATE MODE: Submit unified context
  const submitSubstrate = useCallback(async () => {
    if (!input.trim() && attachments.length === 0) {
      setFeedback({ message: 'Please enter text or add files', type: 'error' });
      return;
    }
    
    setIsGenerating(true);
    setFeedback(null);
    setProcessingStep('Creating unified context...');
    
    try {
      const fragments: Fragment[] = [];
      let position = 0;
      
      // Add text fragment if present
      if (input.trim()) {
        fragments.push({
          id: `fragment-${Date.now()}-${position}`,
          type: input.length > 1000 ? 'text-dump' : 'text',
          content: input,
          position: position++,
          metadata: {
            processing: 'complete'
          }
        });
      }
      
      // Add file fragments
      for (const file of attachments) {
        const fragmentType = getFragmentType(file);
        if (fragmentType) {
          fragments.push({
            id: `fragment-${Date.now()}-${position}`,
            type: fragmentType,
            content: file,
            position: position++,
            metadata: {
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              processing: 'pending'
            }
          });
        }
      }
      
      setProcessingStep('Processing files...');
      
      // Process fragments
      const processedFragments = await FileFragmentHandler.processFragments(
        fragments,
        (status, fragmentIndex) => {
          setProcessingStep(`[${fragmentIndex + 1}/${fragments.length}] ${status}`);
        }
      );
      
      setProcessingStep('Adding to substrate...');
      
      // Submit to substrate
      await substrate.addRawDump(processedFragments);
      
      // Clear inputs
      setInput('');
      setAttachments([]);
      
      setFeedback({
        message: `Added ${processedFragments.length} fragment${processedFragments.length !== 1 ? 's' : ''} to substrate`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Failed to submit substrate:', error);
      setFeedback({
        message: error instanceof Error ? error.message : 'Failed to add to substrate',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
    }
  }, [input, attachments, substrate]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (mode === 'substrate') {
        submitSubstrate();
      } else {
        generateIntelligence();
      }
    }
  }, [mode, submitSubstrate, generateIntelligence]);

  // Primary submit handler
  const handleSubmit = useCallback(() => {
    if (mode === 'substrate') {
      submitSubstrate();
    } else {
      generateIntelligence();
    }
  }, [mode, submitSubstrate, generateIntelligence]);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const hasContent = input.trim() || attachments.length > 0;

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

        {/* Processing state */}
        {isGenerating && processingStep && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Cpu className="h-4 w-4 text-purple-600 animate-pulse" />
            <span className="text-sm text-purple-800">{processingStep}</span>
          </div>
        )}

        {/* Last response with agent attribution */}
        {lastResponse && !isGenerating && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">{lastResponse.message}</p>
            <AgentAttribution
              agentSource={lastResponse.agentSource}
              createdByAgent={true}
              confidence={lastResponse.confidence}
              timestamp={lastResponse.timestamp.toISOString()}
            />
          </div>
        )}

        {/* Input area */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'substrate' ? getContextualPrompt() : "Ask about patterns, request analysis, or explore connections..."}
            className="w-full min-h-[120px] p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isGenerating}
            onKeyDown={handleKeyDown}
          />
          
          {/* File attachments (substrate mode only) */}
          {mode === 'substrate' && attachments.length > 0 && (
            <div className="space-y-2 mt-3">
              {attachments.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm"
                >
                  {getFragmentType(file) === 'pdf' && <div className="w-4 h-4 text-red-600">📄</div>}
                  {getFragmentType(file) === 'image' && <div className="w-4 h-4 text-blue-600">🖼️</div>}
                  {getFragmentType(file) === 'text-dump' && <div className="w-4 h-4 text-green-600">📝</div>}
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    disabled={isGenerating}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded border">
                  {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
                </kbd>
                <span>to send</span>
              </div>
              
              {/* File upload (substrate mode only) */}
              {mode === 'substrate' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.webp"
                    onChange={handleAddAttachment}
                    className="hidden"
                    id="thinking-partner-file-input"
                    disabled={isGenerating}
                  />
                  <label 
                    htmlFor="thinking-partner-file-input"
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-purple-600 cursor-pointer transition-colors"
                  >
                    <Paperclip className="w-3 h-3" />
                    Attach
                  </label>
                </>
              )}
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={mode === 'substrate' ? !hasContent || isGenerating : !input.trim() || isGenerating}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'substrate' ? 'Processing...' : 'Thinking...'}
                </>
              ) : (
                <>
                  {mode === 'substrate' ? (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Add to Research
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insights
                    </>
                  )}
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