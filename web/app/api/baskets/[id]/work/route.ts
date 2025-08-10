// API Bridge: Frontend Next.js → Backend Manager Agent
// This is the critical missing link between the two systems

import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest, 
  context: RouteContext
) {
  try {
    const { id: basketId } = await context.params;
    const body = await request.json();
    
    // Backend Manager Agent URL
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';
    const endpoint = `${backendUrl}/api/baskets/${basketId}/work`;
    
    console.log('🌉 API Bridge: Proxying to backend:', endpoint);
    
    // Proxy request to backend Manager Agent
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('❌ Backend Manager Agent failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Manager Agent failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Manager Agent response:', { deltaId: result.delta_id, changes: result.changes?.length });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ API Bridge error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'API bridge failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// Also handle GET for testing
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: basketId } = await context.params;
  
  return NextResponse.json({
    bridge: 'active',
    basketId,
    backendUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com',
    message: 'API bridge is working. Use POST to send basket work requests.'
  });
}