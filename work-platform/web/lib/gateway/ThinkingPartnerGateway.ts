/**
 * Thinking Partner Gateway
 *
 * Centralized orchestration layer for TP chat and state management.
 * Handles API calls, session management, and real-time updates.
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  TPChatRequest,
  TPChatResponse,
  TPSession,
  TPMessage,
  TPState,
  WorkTicketStatus,
} from '@/lib/types/thinking-partner';
import { fetchWithToken } from '@/lib/fetchWithToken';

/**
 * ThinkingPartnerGateway
 *
 * Manages chat interactions, session state, and real-time updates for TP.
 */
export class ThinkingPartnerGateway {
  private basketId: string;
  private workspaceId: string;
  private sessionId: string | null = null;
  private claudeSessionId: string | null = null;
  private subscription: RealtimeChannel | null = null;

  constructor(basketId: string, workspaceId: string) {
    this.basketId = basketId;
    this.workspaceId = workspaceId;
  }

  /**
   * Send message to TP and get response
   */
  async chat(message: string): Promise<TPChatResponse> {
    const request: TPChatRequest = {
      basket_id: this.basketId,
      message,
      claude_session_id: this.claudeSessionId,
    };

    const response = await fetchWithToken('/api/tp/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to chat with Thinking Partner');
    }

    const data: TPChatResponse = await response.json();

    // Update session IDs for continuity
    this.claudeSessionId = data.claude_session_id;
    if (data.session_id) {
      this.sessionId = data.session_id;
    }

    return data;
  }

  /**
   * Get current session details
   */
  async getSession(): Promise<TPSession | null> {
    if (!this.sessionId) {
      return null;
    }

    const response = await fetchWithToken(`/api/tp/session/${this.sessionId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  /**
   * Get TP capabilities
   */
  async getCapabilities(): Promise<any> {
    const response = await fetch('/api/tp/capabilities');

    if (!response.ok) {
      throw new Error('Failed to fetch TP capabilities');
    }

    return await response.json();
  }

  /**
   * Subscribe to work ticket updates (real-time)
   *
   * TODO: Implement Supabase Realtime subscription
   * For now, return null and use polling in UI
   */
  subscribeToWorkUpdates(
    callback: (update: WorkTicketStatus) => void
  ): RealtimeChannel | null {
    // TODO: Implement Supabase Realtime subscription
    // This will require:
    // 1. Initialize Supabase client
    // 2. Subscribe to work_tickets table
    // 3. Filter by basket_id
    // 4. Call callback on updates

    return null;
  }

  /**
   * Unsubscribe from work updates
   */
  unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Get current session IDs
   */
  getSessionIds(): { sessionId: string | null; claudeSessionId: string | null } {
    return {
      sessionId: this.sessionId,
      claudeSessionId: this.claudeSessionId,
    };
  }

  /**
   * Resume session with existing claude_session_id
   */
  resumeSession(claudeSessionId: string): void {
    this.claudeSessionId = claudeSessionId;
  }

  /**
   * Clear session (start fresh)
   */
  clearSession(): void {
    this.sessionId = null;
    this.claudeSessionId = null;
  }
}

/**
 * Factory function to create ThinkingPartnerGateway
 */
export function createTPGateway(
  basketId: string,
  workspaceId: string
): ThinkingPartnerGateway {
  return new ThinkingPartnerGateway(basketId, workspaceId);
}
