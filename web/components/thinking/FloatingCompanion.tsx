"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Upload, Mic, Sparkles, X, Send, Minimize2, Eye } from 'lucide-react';
import { usePageContext } from '@/lib/intelligence/pageContextDetection';
import { analyzeConversationIntent } from '@/lib/intelligence/conversationAnalyzer';
import { useUniversalChanges } from '@/lib/hooks/useUniversalChanges';
import styles from './FloatingCompanion.module.css';

interface FloatingCompanionProps {
  basketId: string;
  onCapture: (content: any) => void;
  isProcessing?: boolean;
  hasPendingInsights?: boolean;
  onCheckPendingInsights?: () => void;
}

type InputMode = 'text' | 'voice' | 'file' | 'generate';

export function FloatingCompanion({ 
  basketId,
  onCapture, 
  isProcessing = false, 
  hasPendingInsights = false, 
  onCheckPendingInsights 
}: FloatingCompanionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<InputMode | null>(null);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recentActivity, setRecentActivity] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    type: 'success' | 'info' | 'processing';
  } | null>(null);
  
  // Connect to Universal Change Manager
  const changeManager = useUniversalChanges(basketId);
  
  // Use changeManager's processing state for real-time updates
  const actuallyProcessing = isProcessing || changeManager.isProcessing;
  const actualPendingInsights = hasPendingInsights || changeManager.pendingChanges.length > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get contextual awareness
  const pageContext = usePageContext(basketId);
  
  // Feedback helper
  const showFeedback = (message: string, type: 'success' | 'info' | 'processing') => {
    setActionFeedback({ message, type });
    if (type !== 'processing') {
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Listen for custom events from dashboard
  useEffect(() => {
    const handleOpenCompanion = (event: CustomEvent) => {
      const { context, action } = event.detail;
      setIsExpanded(true);
      
      // Set appropriate mode based on context
      if (context === 'add-content') {
        setActiveMode('file'); // Start with file upload for content addition
      } else if (context === 'explore-patterns') {
        setActiveMode('text'); // Start with text input for pattern exploration
      }
      
      // Could also set a specific message or context here
      setRecentActivity(`Helping with: ${action}`);
    };

    window.addEventListener('openFloatingCompanion', handleOpenCompanion as EventListener);
    
    return () => {
      window.removeEventListener('openFloatingCompanion', handleOpenCompanion as EventListener);
    };
  }, []);

  // Simulate awareness indicators
  useEffect(() => {
    const activities = [
      "Watching with you...",
      "Sensing patterns...",
      "Observing quietly...",
      "Following along...",
      "Taking it in..."
    ];
    
    const interval = setInterval(() => {
      if (!isExpanded) {
        setRecentActivity(activities[Math.floor(Math.random() * activities.length)]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isExpanded]);

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

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Analyze intent for intelligent processing
    const intent = analyzeConversationIntent({
      userInput: message.trim(),
      timestamp: new Date().toISOString()
    });

    // If intent suggests intelligence generation, use changeManager
    if (intent.shouldGenerateIntelligence) {
      showFeedback('Generating insights from your input...', 'processing');
      
      try {
        await changeManager.generateIntelligence({
          userInput: message.trim(),
          timestamp: new Date().toISOString(),
          intent,
          context: {
            page: pageContext.page,
            userActivity: pageContext.userActivity,
            selectedText: window.getSelection()?.toString() || ''
          }
        }, 'companion');
        
        showFeedback('Intelligence generated - review insights', 'success');
        
      } catch (error) {
        console.error('Failed to generate intelligence from text:', error);
        showFeedback('Failed to generate intelligence', 'info');
        
        // Fallback to capture method
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
      }
    } else {
      showFeedback('Added to substrate memory ✓', 'success');
      
      // For other intents, use the capture method
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
    }
    
    setMessage('');
    setActiveMode(null);
    setIsExpanded(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      showFeedback(`Processing ${file.name}...`, 'processing');
      
      try {
        // Use changeManager to add context (file handling will be done via FormData)
        await changeManager.addContext([{
          type: file.type.startsWith('image/') ? 'image' : 
                file.type === 'application/pdf' ? 'pdf' : 'file',
          content: `File uploaded: ${file.name}`,
          metadata: { 
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadContext: {
              page: pageContext.page,
              timestamp: new Date().toISOString()
            }
          }
        }]);
        
        showFeedback(`File added to context ✓`, 'success');
        
      } catch (error) {
        console.error('Failed to upload file via changeManager:', error);
        showFeedback('Failed to process file', 'info');
        
        // Fallback to capture method
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
      }
      
      setActiveMode(null);
      setIsExpanded(false);
    }
  };

  const handleVoiceStart = () => {
    setIsListening(true);
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

  const handleGenerateInsights = async () => {
    if (actualPendingInsights && onCheckPendingInsights) {
      showFeedback('Opening pending insights for review', 'info');
      onCheckPendingInsights();
    } else {
      // Direct intelligence generation via changeManager
      showFeedback('Analyzing patterns and insights...', 'processing');
      
      try {
        await changeManager.generateIntelligence({
          userInput: 'Generate insights from current understanding',
          timestamp: new Date().toISOString(),
          intent: {
            type: 'intelligence_request',
            shouldGenerateIntelligence: true,
            triggerPhrase: 'Generate insights'
          },
          context: {
            page: pageContext.page,
            userActivity: pageContext.userActivity,
            trigger: 'manual',
            selectedText: window.getSelection()?.toString() || ''
          }
        }, 'companion');
        
        // Success feedback will show when modal appears
        showFeedback('Intelligence generated - review insights', 'success');
        
      } catch (error) {
        console.error('Failed to generate insights:', error);
        showFeedback('Failed to generate insights', 'info');
        
        // Fallback to old capture method
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

  // Context-adaptive awareness messages
  const getAwarenessMessage = () => {
    const baseMessages = {
      dashboard: "Seeing your research overview",
      document: "Reading with you", 
      timeline: "Reviewing your journey",
      'detailed-view': "Analyzing substrate health"
    };
    
    return baseMessages[pageContext.page as keyof typeof baseMessages] || "Watching with you";
  };

  // Context-adaptive prompts
  const getContextualPrompt = () => {
    if (pageContext.page === 'document') {
      // More specific document prompts based on what might be selected
      const selectedText = window.getSelection()?.toString();
      if (selectedText && selectedText.length > 0) {
        return "What would you like to do with this selection?";
      }
      return "What are you thinking about this section?";
    }
    
    const prompts = {
      dashboard: "What patterns should we explore?",
      timeline: "What evolution do you notice?",
      'detailed-view': "What would strengthen your substrate?"
    };
    
    return prompts[pageContext.page as keyof typeof prompts] || "What's on your mind?";
  };

  // Context-adaptive status messages
  const getStatusMessage = () => {
    const statuses = {
      dashboard: "Looking at your research overview with you",
      document: "Reading and understanding alongside you",
      timeline: "Reflecting on your research journey together", 
      'detailed-view': "Examining your substrate health together"
    };
    
    return statuses[pageContext.page as keyof typeof statuses] || "Thinking together";
  };

  // Get contextual actions based on current page
  const getContextualActions = () => {
    if (pageContext.page === 'document') {
      const selectedText = window.getSelection()?.toString();
      
      if (selectedText && selectedText.length > 0) {
        // Actions for selected text
        return [
          { mode: 'text' as InputMode, label: 'Expand this', icon: MessageCircle },
          { mode: 'generate' as InputMode, label: 'Connect to themes', icon: Sparkles },
          { mode: 'voice' as InputMode, label: 'Reflect on this', icon: Mic }
        ];
      } else {
        // General document actions
        return [
          { mode: 'text' as InputMode, label: 'Continue writing', icon: MessageCircle },
          { mode: 'generate' as InputMode, label: 'Find connections', icon: Sparkles },
          { mode: 'voice' as InputMode, label: 'Voice note', icon: Mic }
        ];
      }
    }
    
    const actions = {
      dashboard: [
        { mode: 'generate' as InputMode, label: 'Generate insights', icon: Sparkles },
        { mode: 'voice' as InputMode, label: 'Voice note', icon: Mic },
        { mode: 'text' as InputMode, label: 'Add context', icon: MessageCircle }
      ],
      timeline: [
        { mode: 'text' as InputMode, label: 'Mark milestone', icon: MessageCircle },
        { mode: 'generate' as InputMode, label: 'Compare periods', icon: Sparkles },
        { mode: 'file' as InputMode, label: 'Export story', icon: Upload }
      ],
      'detailed-view': [
        { mode: 'generate' as InputMode, label: 'Review gaps', icon: Sparkles },
        { mode: 'text' as InputMode, label: 'Process pending', icon: MessageCircle },
        { mode: 'voice' as InputMode, label: 'Deep analysis', icon: Mic }
      ]
    };
    
    return actions[pageContext.page as keyof typeof actions] || actions.dashboard;
  };

  return (
    <>
      {/* Closed State - Organic Companion Presence */}
      {!isExpanded && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleToggle}
            disabled={actuallyProcessing}
            className={`${styles.floatingCompanionClosed} group relative`}
            aria-label="Open thinking companion"
          >
            {/* Main companion presence */}
            <div className={`
              w-16 h-16 transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/20 relative
              bg-white/70 backdrop-blur-md shadow-lg
              ${actuallyProcessing 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white/80'
              }
            `}>
              {actuallyProcessing ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                  
                  {/* Pulsing awareness indicator */}
                  <div className={`absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full ${styles.awarenessIndicator}`}></div>
                  
                  {/* Insights notification */}
                  {actualPendingInsights && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Context hint - fades in/out */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/75 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                🧠 • {getAwarenessMessage()}
                {recentActivity && (
                  <div className="text-purple-300 mt-1">{recentActivity}</div>
                )}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Open State - Thinking Together */}
      {isExpanded && (
        <div className={`${styles.floatingCompanionOpen} fixed bottom-6 right-6 z-50`}>
          <div className="w-96 max-w-[calc(100vw-3rem)] bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl overflow-hidden">
            
            {/* Header - Companion Status */}
            <div className="p-4 border-b border-gray-100/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {getStatusMessage()}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {getAwarenessMessage()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Minimize companion"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Feedback Toast */}
            {actionFeedback && (
              <div className={`mx-4 mt-2 p-3 rounded-lg border ${
                actionFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                actionFeedback.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                'bg-purple-50 border-purple-200 text-purple-800'
              }`}>
                <div className="flex items-center gap-2">
                  {actionFeedback.type === 'success' && <span>✓</span>}
                  {actionFeedback.type === 'info' && <span>ℹ</span>}
                  {actionFeedback.type === 'processing' && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent"></div>
                  )}
                  <span className="text-sm font-medium">{actionFeedback.message}</span>
                </div>
              </div>
            )}

            {/* Current Understanding */}
            <div className="p-4 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
              <div className="flex items-start gap-3">
                <span className="text-lg">🌊</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    What I'm sensing here...
                  </div>
                  <div className="text-xs text-gray-600">
                    {actualPendingInsights 
                      ? "I have new insights about your patterns and connections"
                      : "Still listening and learning from your context..."
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Thinking Space */}
            <div className="p-4">
              {/* Voice recording active state */}
              {isListening && (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Mic className="h-6 w-6 text-white animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-red-700">Listening deeply...</p>
                  <p className="text-xs text-red-600 mt-1">Share what you're discovering</p>
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

              {/* Text input mode */}
              {activeMode === 'text' ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <span>💭</span>
                    <span>{getContextualPrompt()}</span>
                  </div>
                  <form onSubmit={handleTextSubmit}>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Share your thoughts..."
                        className="w-full p-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12 bg-gray-50/50"
                        rows={3}
                        disabled={actuallyProcessing}
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || actuallyProcessing}
                        className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                        aria-label="Share thoughts"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                  
                  <button
                    onClick={() => setActiveMode(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Other options
                  </button>
                </div>
              ) : (
                /* Quick Actions */
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <span>💭</span>
                    <span>{getContextualPrompt()}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {getContextualActions().map((action, idx) => {
                      const IconComponent = action.icon;
                      const isHighlighted = action.mode === 'generate' && actualPendingInsights;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleModeSelect(action.mode)}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                            isHighlighted
                              ? 'bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 hover:from-orange-100 hover:to-pink-100'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                            isHighlighted
                              ? 'bg-gradient-to-br from-orange-500 to-pink-500'
                              : 'bg-gradient-to-br from-purple-500 to-blue-500'
                          }`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <span className={`text-sm font-medium ${
                            isHighlighted ? 'text-orange-900' : 'text-gray-900'
                          }`}>
                            {action.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {actuallyProcessing && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                    <span>Understanding together...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.json"
            />
          </div>
        </div>
      )}

    </>
  );
}