import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@/lib/supabase/clients';

const WORK_PLATFORM_API_URL = process.env.NEXT_PUBLIC_WORK_PLATFORM_API_URL || 'http://localhost:8000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Get Supabase session (canonical pattern)
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = session.access_token;

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.agent_id) {
      return NextResponse.json(
        { detail: 'agent_id is required' },
        { status: 400 }
      );
    }

    if (!body.task_description || body.task_description.trim().length < 10) {
      return NextResponse.json(
        { detail: 'task_description must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Forward to work-platform backend
    const backendResponse = await fetch(
      `${WORK_PLATFORM_API_URL}/api/projects/${projectId}/work-sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'sb-access-token': token,
        },
        body: JSON.stringify({
          agent_id: body.agent_id,
          task_description: body.task_description,
          work_mode: body.work_mode || 'general',
          context: body.context || {},
          priority: body.priority || 5,
        }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ detail: 'Failed to create work session' }));
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CREATE WORK SESSION API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
