import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { WebSocketServer } from '@/lib/websocket/WebSocketServer';

// ============================================================================
// WEBSOCKET CONNECTION ENDPOINT
// ============================================================================
// This endpoint handles WebSocket connections for real-time collaboration
// Supports authentication, room-based subscriptions, and connection management

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');
    const token = searchParams.get('token');

    if (!basketId || !token) {
      return NextResponse.json(
        { error: 'basketId and token are required' },
        { status: 400 }
      );
    }

    // For Next.js deployment, we need to return connection info
    // The actual WebSocket upgrade happens in a separate server process
    return NextResponse.json({
      message: 'WebSocket connection endpoint',
      basketId,
      wsUrl: process.env.WEBSOCKET_URL || `ws://localhost:3001/ws/${basketId}`,
      instructions: 'Connect to the WebSocket URL with your authentication token'
    });

  } catch (error) {
    console.error('WebSocket endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process WebSocket request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { basketId, action, data } = body;

    if (!basketId) {
      return NextResponse.json(
        { error: 'basketId is required' },
        { status: 400 }
      );
    }

    // Verify basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, name')
      .eq('id', basketId)
      .eq('workspace_id', workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: 'Basket not found or access denied' },
        { status: 404 }
      );
    }

    // Handle WebSocket control actions
    switch (action) {
      case 'join':
        // Register user as active in basket
        console.log(`User ${user.id} joining basket ${basketId}`);
        
        // Broadcast user_joined event to other connected clients
        await WebSocketServer.broadcastToBasket(basketId, {
          event: 'user_joined',
          basketId,
          data: {
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }, user.id); // Exclude the user who joined

        return NextResponse.json({
          success: true,
          message: `Joined basket ${basket.name}`,
          basketId,
          userId: user.id
        });

      case 'leave':
        // Unregister user from basket
        console.log(`User ${user.id} leaving basket ${basketId}`);
        
        // Broadcast user_left event to other connected clients
        await WebSocketServer.broadcastToBasket(basketId, {
          event: 'user_left',
          basketId,
          data: {
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }, user.id);

        return NextResponse.json({
          success: true,
          message: `Left basket ${basket.name}`,
          basketId,
          userId: user.id
        });

      case 'status':
        // Get connection status and active users
        const activeUsers = await WebSocketServer.getActiveUsers(basketId);
        
        return NextResponse.json({
          success: true,
          basketId,
          activeUsers: activeUsers.length,
          serverStatus: 'running',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: join, leave, status' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('WebSocket control API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}