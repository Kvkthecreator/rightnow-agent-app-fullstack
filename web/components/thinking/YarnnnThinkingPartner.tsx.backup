"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Upload, Mic, Sparkles, X, Send, Palette } from 'lucide-react';
import Image from 'next/image';
import { usePageContext } from '@/lib/intelligence/pageContextDetection';
import { analyzeConversationIntent, createConversationGenerationRequest } from '@/lib/intelligence/conversationAnalyzer';

interface YarnnnThinkingPartnerProps {
  basketId: string;
  onCapture: (content: any) => void;
  isProcessing?: boolean;
  hasPendingInsights?: boolean;
  onCheckPendingInsights?: () => void;
}

type InputMode = 'text' | 'voice' | 'file' | 'generate';

export function YarnnnThinkingPartner({ 
  basketId,
  onCapture, 
  isProcessing = false, 
  hasPendingInsights = false, 
  onCheckPendingInsights 
}: YarnnnThinkingPartnerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<InputMode | null>(null);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get contextual awareness
  const pageContext = usePageContext(basketId);

  // Auto-focus when text mode activates
  useEffect(() => {
    if (activeMode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeMode]);

  const handleToggle = () => {
    if (isExpanded) {
      // Closing - reset everything
      setActiveMode(null);
      setMessage('');
      setIsListening(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleModeSelect = (mode: InputMode) => {
    setActiveMode(mode);
    
    if (mode === 'file' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (mode === 'voice') {
      handleVoiceStart();
    } else if (mode === 'generate') {
      handleGenerateInsights();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Analyze intent for intelligent processing
    const intent = analyzeConversationIntent({
      userInput: message.trim(),
      timestamp: new Date().toISOString()
    });

    onCapture({
      type: 'conversation',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      intent,
      context: {
        page: pageContext.page,
        userActivity: pageContext.userActivity
      }
    });
    
    setMessage('');
    setActiveMode(null);
    setIsExpanded(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onCapture({
        type: 'file',
        content: file.name,
        file: file,
        timestamp: new Date().toISOString(),
        context: {
          page: pageContext.page,
          fileType: file.type,
          fileSize: file.size
        }
      });
      setActiveMode(null);
      setIsExpanded(false);
    }
  };

  const handleVoiceStart = () => {
    setIsListening(true);
    // Enhanced voice recording would go here
    setTimeout(() => {
      setIsListening(false);
      onCapture({
        type: 'voice',
        content: 'Voice insight captured',
        timestamp: new Date().toISOString(),
        context: {
          page: pageContext.page,
          duration: 3000
        }
      });
      setActiveMode(null);
      setIsExpanded(false);
    }, 3000);
  };

  const handleGenerateInsights = () => {
    if (hasPendingInsights && onCheckPendingInsights) {
      onCheckPendingInsights();
    } else {
      onCapture({
        type: 'generate',
        content: 'Generate insights from current understanding',
        timestamp: new Date().toISOString(),
        context: {
          page: pageContext.page,
          userActivity: pageContext.userActivity,
          trigger: 'manual'
        }
      });
    }
    setActiveMode(null);
    setIsExpanded(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  // Context-aware placeholder text
  const getPlaceholder = () => {
    switch (pageContext.page) {
      case 'document':
        return "Share your thoughts about this document...";
      case 'dashboard':
        return "What's on your mind about your research?";
      case 'timeline':
        return "Reflect on your progress or patterns...";
      default:
        return "What would you like me to understand?";
    }
  };

  // Context-aware greeting
  const getContextualGreeting = () => {
    if (hasPendingInsights) {
      return "I have new insights about your work";
    }
    
    switch (pageContext.page) {
      case 'document':
        return "I'm following along with your document";
      case 'dashboard':
        return "Ready to explore your research together";
      case 'timeline':
        return "Let's reflect on your journey";
      default:
        return "How can I help you think?";
    }
  };

  return (
    <>
      {/* Collapsed State - Pure Yarnnn Aesthetic */}
      {!isExpanded && (
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`
            fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/20 relative z-50
            ${isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700'
            }
          `}
          aria-label="Open Yarnnn thinking partner"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
          ) : (
            <>
              <Image
                src="/assets/logos/yarn-logo-light.png"
                alt="Yarnnn"
                width={28}
                height={28}
                className="mx-auto filter brightness-0 invert"
              />
              {hasPendingInsights && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </>
          )}
        </button>
      )}

      {/* Expanded State - Clean, Human Interface */}
      {isExpanded && (
        <div className="fixed bottom-6 right-6 bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-2xl shadow-2xl p-6 w-80 max-w-[calc(100vw-3rem)] z-50">
          {/* Header with Yarnnn branding */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Image
                  src="/assets/logos/yarn-logo-light.png"
                  alt="Yarnnn"
                  width={16}
                  height={16}
                  className="filter brightness-0 invert"
                />
              </div>
              <div>
                <span className="font-medium text-gray-900">Yarnnn</span>
                <p className="text-xs text-gray-600">{getContextualGreeting()}</p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close thinking partner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Pending insights notification */}
          {hasPendingInsights && (
            <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700 font-medium">New insights ready for you</span>
              </div>
            </div>
          )}

          {/* Voice recording active state */}
          {isListening && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Mic className="h-6 w-6 text-white animate-pulse" />
              </div>
              <p className="text-sm font-medium text-red-700">Listening to your thoughts...</p>
              <p className="text-xs text-red-600 mt-1">Speak naturally about what you're discovering</p>
              <button
                onClick={() => {
                  setIsListening(false);
                  setActiveMode(null);
                }}
                className="mt-3 text-xs text-red-600 underline hover:text-red-700"
              >
                Stop recording
              </button>
            </div>
          )}

          {/* Mode Selection or Active Input */}
          {!activeMode && !isListening ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">How would you like to share your thinking?</p>
              
              <div className="space-y-2">
                {/* Text Mode */}
                <button
                  onClick={() => handleModeSelect('text')}
                  className="flex items-center gap-3 p-3 w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Share your thoughts</div>
                    <div className="text-xs text-gray-500">Express ideas, questions, or reflections</div>
                  </div>
                </button>

                {/* Voice Mode */}
                <button
                  onClick={() => handleModeSelect('voice')}
                  className="flex items-center gap-3 p-3 w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Voice insight</div>
                    <div className="text-xs text-gray-500">Speak your discoveries naturally</div>
                  </div>
                </button>

                {/* File Upload Mode */}
                <button
                  onClick={() => handleModeSelect('file')}
                  className="flex items-center gap-3 p-3 w-full border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Add material</div>
                    <div className="text-xs text-gray-500">Upload documents, images, or notes</div>
                  </div>
                </button>

                {/* Generate Insights Mode */}
                <button
                  onClick={() => handleModeSelect('generate')}
                  className={`flex items-center gap-3 p-3 w-full border rounded-lg transition-colors text-left group ${
                    hasPendingInsights 
                      ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                    hasPendingInsights 
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500' 
                      : 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  }`}>
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${hasPendingInsights ? 'text-orange-900' : 'text-gray-900'}`}>
                      {hasPendingInsights ? 'Review insights' : 'Generate insights'}
                    </div>
                    <div className={`text-xs ${hasPendingInsights ? 'text-orange-700' : 'text-gray-500'}`}>
                      {hasPendingInsights ? 'See what I discovered about your work' : 'Help me understand what you\'re learning'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : activeMode === 'text' ? (
            <div className="space-y-3">
              <form onSubmit={handleTextSubmit}>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={getPlaceholder()}
                    className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                    rows={4}
                    disabled={isProcessing}
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isProcessing}
                    className="absolute bottom-2 right-2 p-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                    aria-label="Share your thoughts"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Press Enter to share, Shift+Enter for new line</p>
              </form>
              
              <button
                onClick={() => setActiveMode(null)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to options
              </button>
            </div>
          ) : null}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                <span>Understanding your thoughts...</span>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.json"
          />
        </div>
      )}
    </>
  );
}