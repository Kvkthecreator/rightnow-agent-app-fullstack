'use client';

/**
 * TPMessageList
 *
 * Displays list of chat messages with TP.
 * Supports markdown rendering, actions taken, and work outputs.
 */

import type { TPMessage } from '@/lib/types/thinking-partner';
import { cn } from '@/lib/utils';
import { CheckCircle2, User, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TPMessageListProps {
  messages: TPMessage[];
}

export function TPMessageList({ messages }: TPMessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <TPMessageCard key={message.id} message={message} />
      ))}
    </div>
  );
}

interface TPMessageCardProps {
  message: TPMessage;
}

function TPMessageCard({ message }: TPMessageCardProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[80%] space-y-2 rounded-lg p-4',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card'
        )}
      >
        {/* Message text */}
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>

        {/* Actions taken (TP only) */}
        {message.actionsTaken && message.actionsTaken.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
            <div className="text-xs font-medium text-muted-foreground">
              Actions Taken:
            </div>
            <ul className="space-y-1">
              {message.actionsTaken.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Work outputs (TP only) */}
        {message.workOutputs && message.workOutputs.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
            <div className="text-xs font-medium text-muted-foreground">
              Work Outputs:
            </div>
            <div className="space-y-2">
              {message.workOutputs.map((output) => (
                <WorkOutputPreview key={output.id} output={output} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 text-xs text-muted-foreground/70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Avatar (user) */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

interface WorkOutputPreviewProps {
  output: {
    id: string;
    outputType: string;
    title: string;
    confidence?: number;
    metadata?: Record<string, any>;
  };
}

function WorkOutputPreview({ output }: WorkOutputPreviewProps) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {output.outputType}
            </Badge>
            {output.confidence !== undefined && (
              <span className="text-xs text-muted-foreground">
                {Math.round(output.confidence * 100)}% confidence
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-medium">{output.title}</div>
        </div>
      </div>
    </div>
  );
}
