"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Sparkles, X, Send, Upload, Mic } from 'lucide-react';
import Image from 'next/image';

interface SimplifiedThinkingPartnerProps {
  basketId: string;
  onCapture: (content: any) => void;
  isProcessing?: boolean;
  hasPendingChanges?: boolean;
  onCheckPendingChanges?: () => void;
}

export function SimplifiedThinkingPartner({ 
  basketId,
  onCapture, 
  isProcessing = false, 
  hasPendingChanges = false, 
  onCheckPendingChanges 
}: SimplifiedThinkingPartnerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleToggle = () => {
    if (isExpanded) {
      setMessage('');
      setIsListening(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onCapture({
      type: 'text',
      content: message.trim(),
      timestamp: new Date().toISOString()
    });
    
    setMessage('');
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
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleVoice = () => {
    setIsListening(true);
    // Simulate voice recording
    setTimeout(() => {
      setIsListening(false);
      onCapture({
        type: 'voice',
        content: 'Voice note captured',
        timestamp: new Date().toISOString()
      });
    }, 3000);
  };

  const handleGenerate = () => {
    if (hasPendingChanges && onCheckPendingChanges) {
      onCheckPendingChanges();
    } else {
      onCapture({
        type: 'generate',
        content: 'Generate insights from current context',
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Collapsed State - Simple FAB */}
      {!isExpanded && (
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`
            fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 relative z-50
            ${isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }
          `}
          aria-label="Open thinking partner"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-white mx-auto" />
              {hasPendingChanges && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </>
          )}
        </button>
      )}

      {/* Expanded State - Clean Interface */}
      {isExpanded && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 max-w-[calc(100vw-3rem)] z-50">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <span className="font-medium text-gray-900">Thinking Partner</span>
            </div>
            <button
              onClick={handleToggle}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close thinking partner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status */}
          {hasPendingChanges && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-orange-600" />
                <span className="text-orange-700">You have insights waiting for review</span>
              </div>
            </div>
          )}

          {/* Voice Recording */}
          {isListening && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <Mic className="h-6 w-6 text-red-600 mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-red-700">Listening... speak naturally</p>
              <button
                onClick={() => setIsListening(false)}
                className="mt-2 text-xs text-red-600 underline"
              >
                Stop recording
              </button>
            </div>
          )}

          {/* Main Input */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="What's on your mind? I can help with insights, analysis, or just listen to your thoughts..."
                className="w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                rows={3}
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!message.trim() || isProcessing}
                className="absolute bottom-2 right-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
          </form>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload className="h-4 w-4 text-gray-600" />
              <span className="text-xs text-gray-600">Upload</span>
            </button>

            <button
              onClick={handleVoice}
              disabled={isProcessing || isListening}
              className="flex flex-col items-center gap-1 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Mic className={`h-4 w-4 ${isListening ? 'text-red-600' : 'text-gray-600'}`} />
              <span className="text-xs text-gray-600">Voice</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors disabled:opacity-50 ${
                hasPendingChanges 
                  ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Sparkles className={`h-4 w-4 ${hasPendingChanges ? 'text-orange-600' : 'text-gray-600'}`} />
              <span className={`text-xs ${hasPendingChanges ? 'text-orange-600' : 'text-gray-600'}`}>
                {hasPendingChanges ? 'Review' : 'Insights'}
              </span>
            </button>
          </div>

          {/* Processing indicator */}
          {isProcessing && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
          />
        </div>
      )}
    </>
  );
}