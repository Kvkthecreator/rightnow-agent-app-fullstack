"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import ResponseCapture from "./ResponseCapture";

interface ConversationMessage {
  type: 'agent' | 'user';
  content: string;
  timestamp: number;
}

interface InterviewQuestion {
  id: string;
  question: string;
  placeholder: string;
  helpText?: string;
  followUp?: string;
}

interface Props {
  conversationHistory: ConversationMessage[];
  currentQuestion: InterviewQuestion;
  onResponse: (response: string) => void;
  onPrevious?: () => void;
  isComplete: boolean;
}

export default function ConversationInterface({
  conversationHistory,
  currentQuestion,
  onResponse,
  onPrevious,
  isComplete
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

  return (
    <div className="space-y-4">
      {/* Conversation History */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {conversationHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'agent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-lg">
                    {message.type === 'agent' ? '🤖' : '👤'}
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <div className={`text-xs mt-1 ${
                      message.type === 'agent' 
                        ? 'text-primary-foreground/70' 
                        : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing indicator when waiting for next question */}
          {!isComplete && conversationHistory.length > 1 && (
            <div className="flex justify-start">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="text-lg">🤖</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Current Question Display */}
      {!isComplete && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">
                Current Question:
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Response Input */}
      {!isComplete && (
        <ResponseCapture
          placeholder={currentQuestion.placeholder}
          onSubmit={onResponse}
          onPrevious={onPrevious}
        />
      )}

      {/* Completion State */}
      {isComplete && (
        <div className="text-center py-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-4xl mb-3">✨</div>
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Interview Complete!
          </h3>
          <p className="text-green-800">
            I'm now analyzing your responses to create your personalized workspace...
          </p>
        </div>
      )}
    </div>
  );
}