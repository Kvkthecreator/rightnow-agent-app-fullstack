'use client';

/**
 * TPChatInterface
 *
 * Main chat interface for Thinking Partner.
 * Handles message display, input, and chat state management.
 */

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { TPMessage, ChatState } from '@/lib/types/thinking-partner';
import { ThinkingPartnerGateway } from '@/lib/gateway/ThinkingPartnerGateway';
import { TPMessageList } from './TPMessageList';

interface TPChatInterfaceProps {
  basketId: string;
  workspaceId: string;
  className?: string;
  onTPStateChange?: (phase: string) => void;
}

export function TPChatInterface({
  basketId,
  workspaceId,
  className,
  onTPStateChange,
}: TPChatInterfaceProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });

  const [inputMessage, setInputMessage] = useState('');
  const gatewayRef = useRef<ThinkingPartnerGateway | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize gateway
  useEffect(() => {
    gatewayRef.current = new ThinkingPartnerGateway(basketId, workspaceId);

    // Cleanup on unmount
    return () => {
      gatewayRef.current?.unsubscribe();
    };
  }, [basketId, workspaceId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !gatewayRef.current || chatState.isLoading) {
      return;
    }

    const userMessage: TPMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: undefined,
    }));

    // Clear input immediately
    const messageTosend = inputMessage.trim();
    setInputMessage('');

    try {
      // Send message to TP
      const response = await gatewayRef.current.chat(messageTosend);

      // Create assistant message
      const assistantMessage: TPMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        actionsTaken: response.actions_taken,
        workOutputs: response.work_outputs,
      };

      // Update chat state
      setChatState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        sessionId: response.session_id,
        claudeSessionId: response.claude_session_id,
      }));

      // Notify parent of TP state change (if work outputs present, likely reviewing)
      if (response.work_outputs.length > 0) {
        onTPStateChange?.('reviewing');
      }
    } catch (error) {
      console.error('Failed to send message to TP:', error);

      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to communicate with Thinking Partner',
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Thinking Partner
            </h2>
            <p className="text-sm text-muted-foreground">
              Chat to orchestrate research, content, and reporting agents
            </p>
          </div>
          {chatState.sessionId && (
            <div className="text-xs text-muted-foreground">
              Session: {chatState.sessionId.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <TPMessageList messages={chatState.messages} />
        <div ref={messagesEndRef} />

        {/* Loading indicator */}
        {chatState.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking Partner is processing...</span>
          </div>
        )}

        {/* Error message */}
        {chatState.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {chatState.error}
          </div>
        )}

        {/* Empty state */}
        {chatState.messages.length === 0 && !chatState.isLoading && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-medium text-foreground">
                Start a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask me to research topics, create content, generate reports, or
                plan multi-step workflows.
              </p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>Examples:</strong>
                </p>
                <ul className="space-y-1 text-left">
                  <li>• "Research AI agent frameworks"</li>
                  <li>• "Create a LinkedIn post about our research"</li>
                  <li>• "Generate a monthly metrics report"</li>
                  <li>• "Research competitors then draft content"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Thinking Partner to orchestrate work..."
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={chatState.isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || chatState.isLoading}
            size="default"
            className="self-end"
          >
            {chatState.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-muted px-1">Shift+Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
}
