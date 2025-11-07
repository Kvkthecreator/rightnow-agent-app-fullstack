import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WORK_PLATFORM_API_URL = process.env.NEXT_PUBLIC_WORK_PLATFORM_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const projectName = formData.get('project_name') as string;
    const initialContext = formData.get('initial_context') as string;
    const description = formData.get('description') as string | null;
    const files = formData.getAll('files') as File[];

    // Validate required fields
    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { detail: 'Project name is required' },
        { status: 400 }
      );
    }

    if (!initialContext || initialContext.trim().length < 10) {
      if (files.length === 0) {
        return NextResponse.json(
          { detail: 'Either initial context (min 10 chars) or files are required' },
          { status: 400 }
        );
      }
    }

    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward to work-platform backend
    // The backend expects: project_name, project_type (defaults to "general"), initial_context, description
    const backendPayload = {
      project_name: projectName.trim(),
      project_type: 'general', // Default project type since it's just a container
      initial_context: initialContext.trim() || 'Initial project setup',
      description: description?.trim() || undefined,
    };

    const backendResponse = await fetch(`${WORK_PLATFORM_API_URL}/api/projects/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(backendPayload),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ detail: 'Failed to create project' }));
      return NextResponse.json(
        errorData,
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();

    // TODO: If files were uploaded, send them to substrate-api for raw_dump ingestion
    // For now, we'll just log them
    if (files.length > 0) {
      console.log(`[CREATE PROJECT] ${files.length} files uploaded, will be processed in future iteration`);
      // Future: Upload files to substrate-api /api/dumps/upload
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[CREATE PROJECT API] Error:', error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
