import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get request body
    const eventData = await request.json();
    
    // For now, just log the event since we need service_role setup
    // This prevents the WebSocket errors while maintaining the API contract
    console.log('Event emission request (service_role setup needed):', eventData);
    
    // TODO: Add proper service_role client when SUPABASE_SERVICE_ROLE_KEY is configured
    // The notification system will still work via direct backend emissions
    
    return NextResponse.json({ success: true, note: 'Event logged, service_role setup needed for persistence' });

  } catch (error) {
    console.error('Event emission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}