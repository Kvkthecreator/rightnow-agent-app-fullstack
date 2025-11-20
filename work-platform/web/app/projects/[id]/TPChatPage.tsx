'use client';

/**
 * TPChatPage
 *
 * Main TP chat interface with split-pane layout.
 * - Left (40%): TPChatInterface
 * - Right (60%): LiveContextPane
 *
 * Implements spatial co-presence model where user sees TP navigate system state.
 */

import { useState } from 'react';
import { TPChatInterface } from '@/components/thinking/TPChatInterface';
import { LiveContextPane } from '@/components/thinking/LiveContextPane';
import { TPPhase } from '@/lib/types/thinking-partner';

interface TPChatPageProps {
  projectId: string;
  projectName: string;
  basketId: string;
  workspaceId: string;
}

export function TPChatPage({
  projectId,
  projectName,
  basketId,
  workspaceId,
}: TPChatPageProps) {
  const [tpPhase, setTPPhase] = useState<TPPhase>('idle');

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left: Chat (40%) */}
      <TPChatInterface
        basketId={basketId}
        workspaceId={workspaceId}
        className="w-2/5 border-r"
        onTPStateChange={(phase) => setTPPhase(phase as TPPhase)}
      />

      {/* Right: Live Context Pane (60%) */}
      <LiveContextPane
        basketId={basketId}
        className="flex-1"
        tpPhase={tpPhase}
      />
    </div>
  );
}
