import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServerClient';
import { ensureWorkspaceServer } from '@/lib/workspaces/ensureWorkspaceServer';
import { analyzeBasketIntelligence } from '@/lib/intelligence/sharedAnalysis';
import type { SubstrateIntelligence } from '@/lib/substrate/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: basketId } = await params;
    const supabase = createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Ensure workspace access
    const workspace = await ensureWorkspaceServer(supabase);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace access required' }, { status: 403 });
    }

    // Use shared analysis instead of making HTTP requests - much faster!
    const intelligenceData = await analyzeBasketIntelligence(supabase, basketId, workspace.id);
    
    if (!intelligenceData) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }

    // Transform to substrate format
    const substrateIntelligence = transformToSubstrateFormat(intelligenceData);

    return NextResponse.json(substrateIntelligence);

  } catch (error) {
    console.error('Substrate intelligence error:', error);
    return NextResponse.json(
      { error: 'Failed to generate substrate intelligence' },
      { status: 500 }
    );
  }
}

function transformToSubstrateFormat(intelligenceData: any): SubstrateIntelligence {
  // Transform shared analysis data to substrate format
  return {
    basketInfo: {
      id: 'basket-id', // Will be populated from the analysis
      name: 'Workspace', // Will be populated from the analysis
      status: 'active',
      lastUpdated: intelligenceData.lastUpdated,
      documentCount: 0, // Will be calculated from analysis
      workspaceId: 'workspace-id'
    },
    contextUnderstanding: {
      intent: intelligenceData.understanding,
      themes: intelligenceData.themes || [],
      coherenceScore: intelligenceData.confidenceScore / 100,
      lastAnalysis: intelligenceData.lastUpdated
    },
    documents: [], // Simplified - documents aren't needed for basic substrate display
    intelligence: {
      insights: intelligenceData.insights || [],
      recommendations: intelligenceData.recommendations || [],
      contextAlerts: [],
      recentActivity: []
    },
    substrateHealth: {
      contextQuality: intelligenceData.confidenceScore / 100,
      documentAlignment: Math.min(intelligenceData.memoryGrowth / 25, 1.0),
      evolutionRate: intelligenceData.confidenceScore > 60 ? 'active' : 
                     intelligenceData.confidenceScore > 30 ? 'growing' : 'stable'
    }
  };
}

// All analysis logic moved to shared utility - this file is now much simpler!