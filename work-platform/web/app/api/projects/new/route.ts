import { NextRequest, NextResponse } from 'next/server';
import { headers, cookies } from 'next/headers';

const WORK_PLATFORM_API_URL = process.env.NEXT_PUBLIC_WORK_PLATFORM_API_URL || 'http://localhost:8000';

/**
 * Extract access token using canonical pattern from lib/server/http.ts
 * Tries headers first, then cookies (per YARNNN_AUTH_CANON.md)
 */
function requireAccessToken(): string {
  const h = headers();

  // Try sb-access-token header
  const sb = h.get('sb-access-token');
  if (sb) return sb;

  // Try Authorization header
  const auth = h.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  // Fall back to cookie
  const c = cookies().get('sb-access-token')?.value;
  if (c) return c;

  throw new Error('NO_TOKEN');
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate auth token (canonical pattern)
    let token: string;
    try {
      token = requireAccessToken();
    } catch (e) {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

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

    // Forward to work-platform backend (canonical auth pattern)
    const backendPayload = {
      project_name: projectName.trim(),
      project_type: 'general', // Default project type since it's just a container
      initial_context: initialContext.trim() || 'Initial project setup',
      description: description?.trim() || undefined,
    };

    // Send both Authorization AND sb-access-token headers (per AUTH_CANON.md line 7-9)
    const backendResponse = await fetch(`${WORK_PLATFORM_API_URL}/api/projects/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'sb-access-token': token,  // Both headers required
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
