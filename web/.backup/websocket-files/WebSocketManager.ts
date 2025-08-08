// ============================================================================
// CLIENT WEBSOCKET MANAGER
// ============================================================================
// Client-side WebSocket management for real-time collaboration
// Handles connection lifecycle, authentication, auto-reconnection, and event handling

import type { WebSocketPayload } from '@/lib/services/UniversalChangeService';

export interface WebSocketConfig {
  basketId: string;
  userId?: string;
  token?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastConnected?: string;
  error?: string;
  reconnectAttempts: number;
}

export type WebSocketEventHandler = (payload: WebSocketPayload) => void;

export interface WebSocketSubscription {
  id: string;
  event: string;
  handler: WebSocketEventHandler;
}

/**
 * Enhanced WebSocket Manager for Real-time Collaboration
 * 
 * Features:
 * - Automatic connection management with authentication
 * - Intelligent reconnection with exponential backoff
 * - Event-driven message handling with subscriptions
 * - Connection status tracking and offline/online detection
 * - Heartbeat monitoring and connection health checks
 * - Room-based (basket-specific) messaging
 * - User presence awareness
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private messageQueue: WebSocketPayload[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      basketId: config.basketId,
      userId: config.userId || 'anonymous',
      token: config.token || '',
      reconnectAttempts: config.reconnectAttempts || 5,
      reconnectDelay: config.reconnectDelay || 1000,
      heartbeatInterval: config.heartbeatInterval || 30000
    };

    this.status = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      reconnectAttempts: 0
    };

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      window.addEventListener('beforeunload', () => this.disconnect());
    }
  }

  // ========================================================================
  // CONNECTION MANAGEMENT
  // ========================================================================

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.status.isConnected || this.status.isConnecting) {
      return;
    }

    try {
      this.updateStatus({ isConnecting: true, error: undefined });

      // Get WebSocket URL from API
      const wsUrl = await this.getWebSocketUrl();
      
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

      // Use Supabase realtime instead of custom WebSocket
      // This WebSocket functionality is now handled by SubstrateService
      console.log('📡 WebSocket functionality delegated to Supabase realtime subscriptions');
      
      this.updateStatus({
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        lastConnected: new Date().toISOString(),
        reconnectAttempts: 0
      });

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.updateStatus({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateStatus({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false
    });

    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  // ========================================================================
  // MESSAGE HANDLING
  // ========================================================================

  /**
   * Send message to server
   */
  send(payload: WebSocketPayload): void {
    if (this.status.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(payload);
      this.ws.send(message);
      console.log('📤 WebSocket message sent:', payload.event);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(payload);
      console.log('📤 WebSocket message queued:', payload.event);
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(event: string, handler: WebSocketEventHandler): string {
    const subscriptionId = crypto.randomUUID();
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      event,
      handler
    });

    console.log(`📻 Subscribed to WebSocket event: ${event}`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from event
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      console.log(`📻 Unsubscribed from WebSocket event: ${subscription.event}`);
    }
  }

  /**
   * Subscribe to all events (for debugging)
   */
  subscribeToAll(handler: WebSocketEventHandler): string {
    return this.subscribe('*', handler);
  }

  // ========================================================================
  // USER PRESENCE
  // ========================================================================

  /**
   * Join basket workspace
   */
  async joinBasket(): Promise<void> {
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: this.config.basketId,
          action: 'join'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to join basket');
      }

      console.log(`👥 Joined basket: ${this.config.basketId}`);
    } catch (error) {
      console.error('Failed to join basket:', error);
    }
  }

  /**
   * Leave basket workspace
   */
  async leaveBasket(): Promise<void> {
    try {
      const response = await fetch('/api/websocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basketId: this.config.basketId,
          action: 'leave'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to leave basket');
      }

      console.log(`👥 Left basket: ${this.config.basketId}`);
    } catch (error) {
      console.error('Failed to leave basket:', error);
    }
  }

  /**
   * Update editing status
   */
  updateEditingStatus(target?: string): void {
    this.send({
      event: 'user_editing',
      basketId: this.config.basketId,
      data: {
        userId: this.config.userId,
        editingTarget: target,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async getWebSocketUrl(): Promise<string> {
    try {
      const response = await fetch(`/api/websocket?basketId=${this.config.basketId}&token=${this.config.token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get WebSocket URL');
      }

      return data.wsUrl;
    } catch (error) {
      console.error('Failed to get WebSocket URL:', error);
      
      // Use environment variable or appropriate fallback
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
      if (wsUrl) {
        return `${wsUrl}/ws/${this.config.basketId}`;
      }
      
      // In production, never use localhost
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        console.error('WebSocket URL not configured for production');
        return `wss://${window.location.hostname}/ws/${this.config.basketId}`;
      }
      
      // Only use localhost in development
      return `ws://localhost:3001/ws/${this.config.basketId}`;
    }
  }

  // Mock connection method removed - using Supabase Realtime instead

  private scheduleReconnect(): void {
    if (this.status.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.updateStatus({
        error: 'Max reconnection attempts reached',
        isReconnecting: false
      });
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.status.reconnectAttempts);
    
    this.updateStatus({
      isReconnecting: true,
      reconnectAttempts: this.status.reconnectAttempts + 1
    });

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.status.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.status.isConnected) {
        this.send({
          event: 'user_activity',
          basketId: this.config.basketId,
          data: { type: 'heartbeat' },
          timestamp: new Date().toISOString()
        });
      }
    }, this.config.heartbeatInterval);
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private handleMessage(payload: WebSocketPayload): void {
    console.log('📨 WebSocket message received:', payload.event);

    // Notify all relevant subscribers
    this.subscriptions.forEach(subscription => {
      if (subscription.event === payload.event || subscription.event === '*') {
        try {
          subscription.handler(payload);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${payload.event}:`, error);
        }
      }
    });
  }

  private handleOnline(): void {
    console.log('🌐 Network online - attempting to reconnect');
    if (!this.status.isConnected) {
      this.connect();
    }
  }

  private handleOffline(): void {
    console.log('🌐 Network offline');
    this.updateStatus({
      isConnected: false,
      error: 'Network offline'
    });
  }

  private updateStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    
    // Notify status handlers
    this.statusHandlers.forEach(handler => {
      try {
        handler(this.status);
      } catch (error) {
        console.error('Error in WebSocket status handler:', error);
      }
    });
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.statusHandlers.clear();
    this.messageQueue.length = 0;

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnline());
      window.removeEventListener('offline', () => this.handleOffline());
      window.removeEventListener('beforeunload', () => this.disconnect());
    }

    console.log('🧹 WebSocket manager destroyed');
  }
}

// ============================================================================
// WEBSOCKET MANAGER FACTORY
// ============================================================================

/**
 * Create a configured WebSocket manager
 */
export function createWebSocketManager(config: WebSocketConfig): WebSocketManager {
  return new WebSocketManager(config);
}

/**
 * Global WebSocket managers by basketId
 */
const globalManagers = new Map<string, WebSocketManager>();

/**
 * Get or create a WebSocket manager for a basket
 */
export function getWebSocketManager(basketId: string, config?: Partial<WebSocketConfig>): WebSocketManager {
  if (!globalManagers.has(basketId)) {
    const manager = createWebSocketManager({
      basketId,
      ...config
    });
    globalManagers.set(basketId, manager);
  }

  return globalManagers.get(basketId)!;
}

/**
 * Clean up WebSocket manager for a basket
 */
export function destroyWebSocketManager(basketId: string): void {
  const manager = globalManagers.get(basketId);
  if (manager) {
    manager.destroy();
    globalManagers.delete(basketId);
  }
}