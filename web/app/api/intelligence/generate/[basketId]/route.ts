import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
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

    // Verify basket access
    const { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("id, name, workspace_id")
      .eq("id", basketId)
      .eq("workspace_id", workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json(
        { error: "Basket not found" },
        { status: 404 }
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
    const intelligenceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/intelligence/basket/${basketId}/dashboard`,
      {
        method: 'GET',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || '',
        }
      }
    );

    if (!intelligenceResponse.ok) {
      throw new Error('Failed to generate intelligence');
    }

    const intelligenceData = await intelligenceResponse.json();

    // Transform to substrate format
    const substrateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/substrate/basket/${basketId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': request.headers.get('authorization') || '',
          'Cookie': request.headers.get('cookie') || '',
        }
      }
    );

    if (!substrateResponse.ok) {
      throw new Error('Failed to transform intelligence to substrate format');
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
      workspaceId: workspace.id,
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
    console.error("Intelligence generation API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}