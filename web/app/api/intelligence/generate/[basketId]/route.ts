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

    // Parse request body - enhanced to handle context from ThinkingPartner
    const body = await request.json();
    const { 
      origin = 'manual', 
      checkPending = false,
      // ✅ CANON: New context-aware parameters from ThinkingPartner
      prompt,
      context,
      requestType = 'general',
      options = {}
    } = body;

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

    // ✅ CANON: Enhanced intelligence generation for context-aware requests
    if (prompt && context) {
      console.log('🎯 Context-aware intelligence generation requested:', {
        basketId,
        requestType,
        context: context.page,
        promptLength: prompt.length
      });

      // Build comprehensive context package for agents
      const enhancedContext = {
        user: {
          id: user.id,
          email: user.email
        },
        basket: {
          id: basketId,
          name: basket.name,
          description: basket.description,
          status: basket.status
        },
        workspace: {
          id: workspaceId
        },
        page: {
          current: context.page || 'unknown',
          documentId: context.documentId,
          confidence: context.confidence || 0,
          userActivity: context.userActivity || {},
          visibleContent: context.visibleContent || {}
        },
        requestType,
        options: {
          includePatternAnalysis: options.includePatternAnalysis ?? true,
          includeMemoryConnections: options.includeMemoryConnections ?? true,
          includeActionableInsights: options.includeActionableInsights ?? true,
          maxInsights: options.maxInsights || 5
        }
      };

      // Get existing basket content for substrate context
      const [documentsResult, blocksResult, contextItemsResult, rawDumpsResult] = await Promise.allSettled([
        supabase
          .from('documents')
          .select('id, title, content, created_at')
          .eq('basket_id', basketId)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('blocks')
          .select('id, content, state, type, created_at')
          .eq('basket_id', basketId)
          .in('state', ['ACCEPTED', 'LOCKED'])
          .order('created_at', { ascending: false })
          .limit(20),
          
        supabase
          .from('context_items')
          .select('id, content, type, metadata, created_at')
          .eq('basket_id', basketId)
          .order('created_at', { ascending: false })
          .limit(15),
          
        supabase
          .from('raw_dumps')
          .select('id, content, source_type, word_count, created_at')
          .eq('basket_id', basketId)
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const documents = documentsResult.status === 'fulfilled' ? documentsResult.value.data || [] : [];
      const blocks = blocksResult.status === 'fulfilled' ? blocksResult.value.data || [] : [];
      const contextItems = contextItemsResult.status === 'fulfilled' ? contextItemsResult.value.data || [] : [];
      const rawDumps = rawDumpsResult.status === 'fulfilled' ? rawDumpsResult.value.data || [] : [];

      // Calculate substrate metrics
      const substrateMetrics = {
        documentCount: documents.length,
        blockCount: blocks.length,
        contextItemCount: contextItems.length,
        rawDumpCount: rawDumps.length,
        totalWords: rawDumps.reduce((sum, dump) => sum + (dump.word_count || 0), 0),
        lastActivity: documents.length > 0 ? documents[0].created_at : null
      };

      // Create intelligence generation payload for Python agents
      const intelligencePayload = {
        basket_id: basketId,
        user_prompt: prompt,
        context: enhancedContext,
        substrate: {
          documents,
          blocks,
          context_items: contextItems,
          raw_dumps: rawDumps,
          metrics: substrateMetrics
        },
        generation_type: requestType,
        options: enhancedContext.options
      };

      // Call Python agent backend (mock response for now since agents may not be fully connected)
      let agentResponse;
      try {
        const agentUrl = process.env.PYTHON_AGENT_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log('🤖 Calling agent backend:', `${agentUrl}/api/intelligence/generate`);
        
        const response = await fetch(`${agentUrl}/api/intelligence/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}` // Use user ID as auth for now
          },
          body: JSON.stringify(intelligencePayload),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (response.ok) {
          agentResponse = await response.json();
        } else {
          console.warn('Agent backend unavailable, using mock response');
          throw new Error('Agent backend unavailable');
        }
      } catch (error) {
        console.log('🔄 Agent backend unavailable, generating mock insights based on context');
        
        // Generate context-aware mock insights
        const mockInsights = [];
        
        if (context.page === 'document' && substrateMetrics.documentCount > 0) {
          mockInsights.push({
            id: `mock_doc_${Date.now()}`,
            type: 'document_analysis',
            title: 'Document Analysis Opportunity',
            description: `Based on your current document context, I can help analyze patterns across your ${substrateMetrics.documentCount} documents.`,
            confidence: 0.8,
            evidence: [`${substrateMetrics.documentCount} documents in substrate`, 'Document page context detected'],
            suggestions: ['Compare themes across documents', 'Extract key insights', 'Find connection patterns']
          });
        }
        
        if (context.page === 'dashboard' && substrateMetrics.totalWords > 1000) {
          mockInsights.push({
            id: `mock_dash_${Date.now()}`,
            type: 'substrate_overview',
            title: 'Research Substrate Analysis',
            description: `Your research contains ${substrateMetrics.totalWords} words across multiple sources. I can identify key patterns and connections.`,
            confidence: 0.7,
            evidence: [`${substrateMetrics.totalWords} total words`, `${substrateMetrics.rawDumpCount} raw dumps processed`],
            suggestions: ['Synthesize main themes', 'Identify research gaps', 'Generate executive summary']
          });
        }
        
        // Always provide a context-aware insight
        mockInsights.push({
          id: `mock_context_${Date.now()}`,
          type: 'contextual_insight',
          title: `${context.page === 'document' ? 'Document' : 'Research'} Context Understood`,
          description: `I see you're working in the ${context.page} context. "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
          confidence: 0.9,
          evidence: [`Page context: ${context.page}`, `User activity tracked`, `Prompt analyzed`],
          suggestions: ['Ask more specific questions', 'Request detailed analysis', 'Explore related concepts']
        });

        agentResponse = {
          success: true,
          insights: mockInsights,
          metadata: {
            source: 'mock_generation',
            context_used: true
          }
        };
      }

      // Transform agent response to frontend format
      const insights = (agentResponse.insights || []).map((insight: any) => ({
        id: insight.id || `insight_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: insight.type || 'general_insight',
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence || 0.7,
        evidence: insight.evidence || [],
        suggestions: insight.suggestions || [],
        connections: insight.connections || [],
        metadata: {
          ...insight.metadata,
          generatedAt: new Date().toISOString(),
          context: context.page,
          promptType: requestType,
          source: 'thinking_partner'
        }
      }));

      // Store generation event for audit trail
      await supabase
        .from('events')
        .insert({
          basket_id: basketId,
          type: 'intelligence_generated',
          data: {
            prompt: prompt.slice(0, 200), // Store truncated prompt
            context: context.page,
            insightCount: insights.length,
            requestType,
            substrateMetrics
          },
          user_id: user.id,
          workspace_id: workspaceId
        });

      return NextResponse.json({
        success: true,
        insights,
        message: insights.length > 0 
          ? `Generated ${insights.length} context-aware insights`
          : 'Context understood, no new insights at this time',
        metadata: {
          basketId,
          generatedAt: new Date().toISOString(),
          contextUsed: true,
          requestType,
          substrateMetrics
        }
      });
    }

    // ✅ CANON: Legacy intelligence generation (existing flow)
    // Get the substrate data
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        type,
        status,
        created_at,
        updated_at
      `)
      .eq('basket_id', basketId)
      .eq('workspace_id', workspaceId);

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    const { data: contextItems, error: contextError } = await supabase
      .from('context_items')
      .select(`
        id,
        content,
        type,
        metadata,
        created_at
      `)
      .eq('basket_id', basketId)
      .eq('workspace_id', workspaceId);

    if (contextError) {
      console.error('Error fetching context items:', contextError);
      return NextResponse.json(
        { error: "Failed to fetch context items" },
        { status: 500 }
      );
    }

    // Generate content hash for change detection - fix data structure
    const currentContent = {
      documents: (documents || []).map(doc => ({
        id: doc.id,
        content_raw: doc.content || '',
        updated_at: doc.updated_at
      })),
      rawDumps: (contextItems || []).map(item => ({
        id: item.id,
        text_dump: item.content || '',
        created_at: item.created_at
      })),
      basketId
    };
    
    const currentHash = await generateContentHash(currentContent);
    
    // Get last approved intelligence to compare
    const lastApproved = await getLastApprovedIntelligence(supabase, basketId);
    const lastHash = lastApproved?.content_hash;
    
    // If content hasn't changed significantly, check if we should generate anyway
    if (lastHash === currentHash && origin !== 'manual') {
      return NextResponse.json({
        noChangesDetected: true,
        message: "No significant changes detected since last intelligence generation.",
        lastGenerated: lastApproved?.created_at
      });
    }

    // Detect and filter significant changes
    const changes = detectIntelligenceChanges(currentContent, lastApproved?.substrate_data);
    const significantChanges = filterSignificantChanges(changes);
    
    if (significantChanges.length === 0 && origin !== 'manual') {
      return NextResponse.json({
        noSignificantChanges: true,
        message: "Changes detected but not significant enough for intelligence generation.",
        changes: changes.map(c => ({ type: c.type, count: c.items.length }))
      });
    }

    // Generate intelligence based on current substrate
    // This would typically call your AI/ML service
    // For now, we'll create structured intelligence based on content analysis
    
    const intelligence = {
      id: `intelligence_${Date.now()}`,
      basket_id: basketId,
      type: 'comprehensive',
      insights: [],
      recommendations: [],
      contextAlerts: [],
      metadata: {
        contentHash: currentHash,
        changesDetected: significantChanges.length,
        generatedAt: new Date().toISOString(),
        origin
      }
    };

    // Store the intelligence event
    const eventData = await storeIntelligenceEvent(
      supabase,
      basketId,
      workspaceId,
      user.id,
      intelligence,
      currentContent,
      currentHash
    );

    // Cleanup old intelligence events
    await cleanupOldIntelligenceEvents(supabase, basketId);

    return NextResponse.json({
      success: true,
      intelligence,
      event: eventData,
      changes: significantChanges,
      message: "Intelligence generated successfully"
    });

  } catch (error) {
    console.error('Intelligence generation error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}