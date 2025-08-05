// ============================================================================
// WEBSOCKET SERVER INFRASTRUCTURE
// ============================================================================
// Server-side WebSocket management for real-time collaboration
// Handles connections, authentication, room-based subscriptions, and broadcasting

import type { WebSocketPayload } from '@/lib/services/UniversalChangeService';

export interface WebSocketConnection {
  id: string;
  userId: string;
  basketId: string;
  userEmail?: string;
  connectedAt: string;
  lastHeartbeat: string;
}

export interface ActiveUser {
  userId: string;
  userEmail?: string;
  connectedAt: string;
  isEditing?: string; // Document or section being edited
}

export interface WebSocketRoom {
  basketId: string;
  connections: Map<string, WebSocketConnection>;
  activeUsers: Map<string, ActiveUser>;
  lastActivity: string;
}

/**
 * WebSocket Server Manager
 * 
 * This class provides server-side WebSocket management including:
 * - Connection lifecycle management
 * - Authentication and authorization
 * - Room-based subscriptions (basket-specific channels)
 * - Real-time event broadcasting
 * - User presence tracking
 * - Connection heartbeat and cleanup
 */
export class WebSocketServer {
  private static instance: WebSocketServer | null = null;
  private rooms: Map<string, WebSocketRoom> = new Map();
  private globalConnections: Map<string, WebSocketConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHeartbeat();
    this.startCleanup();
  }

  static getInstance(): WebSocketServer {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer();
    }
    return WebSocketServer.instance;
  }

  // ========================================================================
  // CONNECTION MANAGEMENT
  // ========================================================================

  /**
   * Register a new WebSocket connection
   */
  static async addConnection(
    connectionId: string,
    userId: string,
    basketId: string,
    userEmail?: string
  ): Promise<void> {
    const server = WebSocketServer.getInstance();
    
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      basketId,
      userEmail,
      connectedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString()
    };

    // Add to global connections
    server.globalConnections.set(connectionId, connection);

    // Add to basket room
    if (!server.rooms.has(basketId)) {
      server.rooms.set(basketId, {
        basketId,
        connections: new Map(),
        activeUsers: new Map(),
        lastActivity: new Date().toISOString()
      });
    }

    const room = server.rooms.get(basketId)!;
    room.connections.set(connectionId, connection);
    
    // Update active users
    room.activeUsers.set(userId, {
      userId,
      userEmail,
      connectedAt: connection.connectedAt
    });

    room.lastActivity = new Date().toISOString();

    console.log(`📡 WebSocket connection added: ${connectionId} for user ${userId} in basket ${basketId}`);
  }

  /**
   * Remove a WebSocket connection
   */
  static async removeConnection(connectionId: string): Promise<void> {
    const server = WebSocketServer.getInstance();
    const connection = server.globalConnections.get(connectionId);

    if (!connection) return;

    // Remove from global connections
    server.globalConnections.delete(connectionId);

    // Remove from room
    const room = server.rooms.get(connection.basketId);
    if (room) {
      room.connections.delete(connectionId);
      
      // Check if user has other connections in this room
      const userStillConnected = Array.from(room.connections.values())
        .some(conn => conn.userId === connection.userId);

      if (!userStillConnected) {
        room.activeUsers.delete(connection.userId);
      }

      room.lastActivity = new Date().toISOString();

      // Clean up empty rooms
      if (room.connections.size === 0) {
        server.rooms.delete(connection.basketId);
      }
    }

    console.log(`📡 WebSocket connection removed: ${connectionId} for user ${connection.userId}`);
  }

  /**
   * Update connection heartbeat
   */
  static async updateHeartbeat(connectionId: string): Promise<void> {
    const server = WebSocketServer.getInstance();
    const connection = server.globalConnections.get(connectionId);

    if (connection) {
      connection.lastHeartbeat = new Date().toISOString();
      
      // Update room activity
      const room = server.rooms.get(connection.basketId);
      if (room) {
        room.lastActivity = new Date().toISOString();
      }
    }
  }

  // ========================================================================
  // BROADCASTING
  // ========================================================================

  /**
   * Broadcast message to all connections in a basket
   */
  static async broadcastToBasket(
    basketId: string,
    payload: WebSocketPayload,
    excludeUserId?: string
  ): Promise<void> {
    const server = WebSocketServer.getInstance();
    const room = server.rooms.get(basketId);

    if (!room) {
      console.log(`📡 No active room for basket ${basketId}`);
      return;
    }

    const connections = Array.from(room.connections.values())
      .filter(conn => !excludeUserId || conn.userId !== excludeUserId);

    console.log(`📡 Broadcasting to ${connections.length} connections in basket ${basketId}:`, payload.event);

    // In a real implementation, this would send WebSocket messages
    // For now, we'll simulate broadcasting by logging
    for (const connection of connections) {
      console.log(`📤 Sending to ${connection.userId}: ${payload.event}`);
      // await sendWebSocketMessage(connection.id, payload);
    }

    room.lastActivity = new Date().toISOString();
  }

  /**
   * Broadcast message to specific user across all their connections
   */
  static async broadcastToUser(
    userId: string,
    payload: WebSocketPayload
  ): Promise<void> {
    const server = WebSocketServer.getInstance();
    
    const userConnections = Array.from(server.globalConnections.values())
      .filter(conn => conn.userId === userId);

    console.log(`📡 Broadcasting to user ${userId} across ${userConnections.length} connections:`, payload.event);

    for (const connection of userConnections) {
      console.log(`📤 Sending to connection ${connection.id}: ${payload.event}`);
      // await sendWebSocketMessage(connection.id, payload);
    }
  }

  /**
   * Send message to specific connection
   */
  static async sendToConnection(
    connectionId: string,
    payload: WebSocketPayload
  ): Promise<void> {
    const server = WebSocketServer.getInstance();
    const connection = server.globalConnections.get(connectionId);

    if (!connection) {
      console.log(`📡 Connection ${connectionId} not found`);
      return;
    }

    console.log(`📤 Sending to connection ${connectionId}: ${payload.event}`);
    // await sendWebSocketMessage(connectionId, payload);

    // Update heartbeat
    await WebSocketServer.updateHeartbeat(connectionId);
  }

  // ========================================================================
  // USER PRESENCE
  // ========================================================================

  /**
   * Get active users in a basket
   */
  static async getActiveUsers(basketId: string): Promise<ActiveUser[]> {
    const server = WebSocketServer.getInstance();
    const room = server.rooms.get(basketId);

    if (!room) return [];

    return Array.from(room.activeUsers.values());
  }

  /**
   * Update user editing status
   */
  static async updateUserEditing(
    userId: string,
    basketId: string,
    editingTarget?: string
  ): Promise<void> {
    const server = WebSocketServer.getInstance();
    const room = server.rooms.get(basketId);

    if (!room) return;

    const user = room.activeUsers.get(userId);
    if (user) {
      user.isEditing = editingTarget;
      
      // Broadcast editing status to other users
      await WebSocketServer.broadcastToBasket(basketId, {
        event: 'user_editing',
        basketId,
        data: {
          userId,
          userEmail: user.userEmail,
          isEditing: editingTarget,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }, userId);
    }
  }

  /**
   * Get room statistics
   */
  static async getRoomStats(basketId: string): Promise<{
    activeConnections: number;
    activeUsers: number;
    lastActivity: string;
  } | null> {
    const server = WebSocketServer.getInstance();
    const room = server.rooms.get(basketId);

    if (!room) return null;

    return {
      activeConnections: room.connections.size,
      activeUsers: room.activeUsers.size,
      lastActivity: room.lastActivity
    };
  }

  // ========================================================================
  // MAINTENANCE
  // ========================================================================

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, 30000);
  }

  private startCleanup(): void {
    // Cleanup stale connections every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 120000);
  }

  private async sendHeartbeats(): Promise<void> {
    const heartbeatPayload: WebSocketPayload = {
      event: 'user_activity',
      basketId: 'system',
      data: { type: 'heartbeat' },
      timestamp: new Date().toISOString()
    };

    // In a real implementation, send heartbeat to all connections
    console.log(`💓 Sending heartbeat to ${this.globalConnections.size} connections`);
  }

  private async cleanupStaleConnections(): Promise<void> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    const staleConnections = Array.from(this.globalConnections.entries())
      .filter(([_, connection]) => {
        const lastHeartbeat = new Date(connection.lastHeartbeat);
        return now.getTime() - lastHeartbeat.getTime() > staleThreshold;
      });

    for (const [connectionId] of staleConnections) {
      console.log(`🧹 Cleaning up stale connection: ${connectionId}`);
      await WebSocketServer.removeConnection(connectionId);
    }

    if (staleConnections.length > 0) {
      console.log(`🧹 Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Shutdown the WebSocket server
   */
  static async shutdown(): Promise<void> {
    const server = WebSocketServer.getInstance();
    
    if (server.heartbeatInterval) {
      clearInterval(server.heartbeatInterval);
    }
    
    if (server.cleanupInterval) {
      clearInterval(server.cleanupInterval);
    }

    // Close all connections
    const connectionIds = Array.from(server.globalConnections.keys());
    for (const connectionId of connectionIds) {
      await WebSocketServer.removeConnection(connectionId);
    }

    console.log('📡 WebSocket server shut down');
  }
}

// ============================================================================
// SIMULATED WEBSOCKET FUNCTIONS
// ============================================================================
// These would be replaced with actual WebSocket implementations

async function sendWebSocketMessage(connectionId: string, payload: WebSocketPayload): Promise<void> {
  // In a real implementation, this would send the message over WebSocket
  // For development, we simulate this
  console.log(`📡 [SIMULATED] Sending WebSocket message to ${connectionId}:`, payload);
}