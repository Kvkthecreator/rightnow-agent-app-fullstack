"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Type, Upload, Mic, Sparkles, X, Send } from 'lucide-react';
import Image from 'next/image';

interface FloatingCommunicationProps {
  onCapture: (content: any) => void;
  isProcessing?: boolean;
  hasPendingChanges?: boolean;
  onCheckPendingChanges?: () => void;
}

export function FloatingCommunication({ 
  onCapture, 
  isProcessing = false, 
  hasPendingChanges = false, 
  onCheckPendingChanges 
}: FloatingCommunicationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<'text' | 'upload' | 'voice' | 'generate' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when text mode is selected
  useEffect(() => {
    if (activeMode === 'text' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeMode]);

  const handleToggle = () => {
    if (isExpanded) {
      // Closing - reset state
      setActiveMode(null);
      setTextInput('');
      setIsListening(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleModeSelect = (mode: 'text' | 'upload' | 'voice' | 'generate') => {
    setActiveMode(mode);
    
    if (mode === 'upload' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (mode === 'voice') {
      handleVoiceCapture();
    } else if (mode === 'generate') {
      handleGenerate();
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onCapture({
        type: 'text',
        content: textInput.trim(),
        timestamp: new Date().toISOString()
      });
      setTextInput('');
      setActiveMode(null);
    }
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
      setActiveMode(null);
    }
  };

  const handleVoiceCapture = () => {
    // Placeholder for voice recording functionality
    setIsListening(true);
    // In a real implementation, you would start recording here
    setTimeout(() => {
      setIsListening(false);
      onCapture({
        type: 'voice',
        content: 'Voice recording captured',
        timestamp: new Date().toISOString()
      });
      setActiveMode(null);
    }, 3000);
  };

  const handleGenerate = () => {
    // Check for pending changes first
    if (hasPendingChanges && onCheckPendingChanges) {
      onCheckPendingChanges();
    } else {
      onCapture({
        type: 'generate',
        content: 'Generate insights from current context',
        timestamp: new Date().toISOString()
      });
    }
    setActiveMode(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  return (
    <>
      {/* Main Floating Button */}
      {!isExpanded && (
        <button
          onClick={handleToggle}
          disabled={isProcessing}
          className={`
            fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/20 relative
            ${isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }
          `}
        >
          {isProcessing ? (
            <div className="w-8 h-8 mx-auto">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mt-1"></div>
            </div>
          ) : (
            <>
              <Image
                src="/assets/logos/yarn-logo-light.png"
                alt="Yarnnn Intelligence"
                width={32}
                height={32}
                className="mx-auto filter brightness-0 invert"
              />
              {hasPendingChanges && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </>
          )}
        </button>
      )}

      {/* Expanded Interface */}
      {isExpanded && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-w-[calc(100vw-3rem)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/logos/yarn-logo-light.png"
                alt="Yarnnn"
                width={24}
                height={24}
              />
              <span className="font-medium text-gray-900">Yarnnn Intelligence</span>
            </div>
            <button
              onClick={handleToggle}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Selection or Active Mode */}
          {!activeMode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">How would you like to capture your thinking?</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleModeSelect('text')}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Type className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Text</div>
                    <div className="text-xs text-gray-500">Quick thoughts</div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('upload')}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Upload className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Upload</div>
                    <div className="text-xs text-gray-500">Files & docs</div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('voice')}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Mic className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Voice</div>
                    <div className="text-xs text-gray-500">Audio notes</div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('generate')}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-colors text-left relative ${
                    hasPendingChanges 
                      ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Sparkles className={`h-4 w-4 ${hasPendingChanges ? 'text-orange-700' : 'text-orange-600'}`} />
                  <div>
                    <div className={`text-sm font-medium ${hasPendingChanges ? 'text-orange-900' : 'text-gray-900'}`}>
                      {hasPendingChanges ? 'Review' : 'Generate'}
                    </div>
                    <div className={`text-xs ${hasPendingChanges ? 'text-orange-700' : 'text-gray-500'}`}>
                      {hasPendingChanges ? 'Pending changes' : 'New insights'}
                    </div>
                  </div>
                  {hasPendingChanges && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Text Input Mode */}
              {activeMode === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's on your mind?
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your thoughts here..."
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim()}
                      className="absolute bottom-2 right-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</p>
                </div>
              )}

              {/* Voice Recording Mode */}
              {activeMode === 'voice' && isListening && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <Mic className="h-8 w-8 text-red-600 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Listening...</p>
                  <p className="text-xs text-gray-500 mt-1">Speak your thoughts naturally</p>
                  <button
                    onClick={() => {
                      setIsListening(false);
                      setActiveMode(null);
                    }}
                    className="mt-4 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Stop Recording
                  </button>
                </div>
              )}

              {/* Back Button */}
              <button
                onClick={() => setActiveMode(null)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to options
              </button>
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