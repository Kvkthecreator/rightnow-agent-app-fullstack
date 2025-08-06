import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { getWorkspaceFromBasket } from "@/lib/utils/workspace";
import { 
  generateContentHash, 
  detectIntelligenceChanges, 
  filterSignificantChanges 
} from "@/lib/intelligence/changeDetection";
import { 
  storeIntelligenceEvent, 
  getLastApprovedIntelligence, 
  hasPendingIntelligenceChanges,
  cleanupOldIntelligenceEvents 
} from "@/lib/intelligence/intelligenceEvents";

// Rate limiting for background generation
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ basketId: string }> }
) {
  try {
    const { basketId } = await params;
    const supabase = createServerSupabaseClient();
    
    // Authentication check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { origin = 'manual', checkPending = false } = body;

    // Check for existing pending changes if requested
    if (checkPending) {
      const hasPending = await hasPendingIntelligenceChanges(supabase, basketId);
      if (hasPending) {
        return NextResponse.json({
          hasPendingChanges: true,
          message: "Pending changes exist. Review them before generating new intelligence."
        });
      }
    }

    // Rate limiting for automatic/background generation
    if (origin !== 'manual') {
      const now = Date.now();
      const lastGeneration = rateLimitMap.get(basketId) || 0;
      
      if (now - lastGeneration < RATE_LIMIT_WINDOW) {
        return NextResponse.json({
          rateLimited: true,
          message: "Rate limit exceeded. Please wait before generating again.",
          waitTime: RATE_LIMIT_WINDOW - (now - lastGeneration)
        }, { status: 429 });
      }
      
      rateLimitMap.set(basketId, now);
    }

    // Get workspace_id from basket using utility
    const basketResult = await getWorkspaceFromBasket(supabase, basketId);
    if ('error' in basketResult) {
      return NextResponse.json(
        { error: basketResult.error },
        { status: 404 }
      );
    }
    
    const { workspaceId, basket } = basketResult;
    
    // Verify user has access to this workspace
    if (workspaceId !== workspace.id) {
      return NextResponse.json(
        { error: "Unauthorized access to workspace" },
        { status: 403 }
      );
    }

    // Fetch current content for hashing and analysis
    const [documentsResult, rawDumpsResult] = await Promise.all([
      supabase
        .from('documents')
        .select('id, content_raw, updated_at')
        .eq('basket_id', basketId),
      supabase
        .from('raw_dumps')
        .select('id, text_dump, created_at')
        .eq('basket_id', basketId)
    ]);

    const documents = documentsResult.data || [];
    const rawDumps = rawDumpsResult.data || [];

    // Generate content hash
    const contentHash = await generateContentHash({
      documents,
      rawDumps,
      basketId
    });

    // Generate new intelligence using existing endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace('yarnnn.com', 'www.yarnnn.com') || 
                    'https://www.yarnnn.com';
    const intelligenceUrl = `${baseUrl}/api/intelligence/basket/${basketId}/dashboard`;
    
    console.log('🧠 Fetching intelligence from:', intelligenceUrl);
    
    const intelligenceResponse = await fetch(
      intelligenceUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || '',
        }
      }
    );

    if (!intelligenceResponse.ok) {
      const errorText = await intelligenceResponse.text().catch(() => 'No response body');
      console.error('❗ Intelligence API error:', {
        status: intelligenceResponse.status,
        statusText: intelligenceResponse.statusText,
        url: intelligenceUrl,
        response: errorText
      });
      throw new Error(`Failed to generate intelligence: ${intelligenceResponse.status} ${intelligenceResponse.statusText}`);
    }

    const intelligenceData = await intelligenceResponse.json();

    // Transform to substrate format
    const substrateUrl = `${baseUrl}/api/substrate/basket/${basketId}`;
    console.log('🔄 Fetching substrate from:', substrateUrl);
    
    const substrateResponse = await fetch(
      substrateUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || '',
        }
      }
    );

    if (!substrateResponse.ok) {
      const errorText = await substrateResponse.text().catch(() => 'No response body');
      console.error('❗ Substrate API error:', {
        status: substrateResponse.status,
        statusText: substrateResponse.statusText,
        url: substrateUrl,
        response: errorText
      });
      throw new Error(`Failed to transform intelligence to substrate format: ${substrateResponse.status} ${substrateResponse.statusText}`);
    }

    const newIntelligence = await substrateResponse.json();

    // Get last approved intelligence for comparison
    const lastApproved = await getLastApprovedIntelligence(supabase, basketId);
    
    let changes: any[] = [];
    if (lastApproved) {
      // Detect changes between last approved and new intelligence
      const detectedChanges = detectIntelligenceChanges(lastApproved, newIntelligence);
      changes = filterSignificantChanges(detectedChanges, 'moderate');
    }

    // If no significant changes, don't create an event
    if (changes.length === 0 && lastApproved) {
      return NextResponse.json({
        noChanges: true,
        message: "No significant changes detected in intelligence.",
        contentHash: contentHash.basketHash
      });
    }

    // Store intelligence generation event
    const intelligenceEvent = await storeIntelligenceEvent(supabase, {
      basketId,
      workspaceId, // Use workspaceId from basket
      kind: 'intelligence_generation',
      intelligence: newIntelligence,
      contentHash,
      changes,
      approvalState: 'pending',
      approvedSections: [],
      actorId: user.id,
      origin: origin as 'manual' | 'automatic' | 'background'
    });

    // Cleanup old events
    await cleanupOldIntelligenceEvents(supabase, basketId);

    return NextResponse.json({
      success: true,
      eventId: intelligenceEvent.id,
      changesDetected: changes.length,
      contentHash: contentHash.basketHash,
      requiresReview: changes.length > 0
    });

  } catch (error) {
    const { basketId } = await params;
    const supabase = createServerSupabaseClient();
    console.error('Intelligence generation API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      basketId,
      userId: await supabase.auth.getUser().then(({data}) => data.user?.id),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate intelligence' },
      { status: 500 }
    );
  }
}