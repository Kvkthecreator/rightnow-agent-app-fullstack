export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';

interface EnhanceRequest {
  current_content: string;
  enhancement_intent: string;
  context: {
    basket_id: string;
    window_days: number;
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const body: EnhanceRequest = await req.json();
    
    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    
    // Verify document access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, basket_id, title, workspace_id')
      .eq('id', documentId)
      .single();
      
    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Verify basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('workspace_id')
      .eq('id', document.basket_id)
      .single();
      
    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket not found' }, { status: 404 });
    }
    
    // For now, return a simple enhanced version
    // This could be replaced with actual AI enhancement logic
    const enhanced_content = await enhanceDocumentContent(
      body.current_content,
      body.enhancement_intent,
      document.basket_id
    );
    
    return NextResponse.json({
      enhanced_content,
      enhancement_applied: true,
      original_length: body.current_content.length,
      enhanced_length: enhanced_content.length
    });
    
  } catch (error) {
    console.error('Document enhancement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function enhanceDocumentContent(
  currentContent: string,
  intent: string,
  basketId: string
): Promise<string> {
  // Simple enhancement for now - could be replaced with actual AI logic
  if (!currentContent.trim()) {
    return "This document has been enhanced with AI insights.\n\nPlease add some initial content to get meaningful enhancements.";
  }
  
  const enhancement = `

---

## AI Enhancement

Based on your knowledge base, here are some suggestions to expand this document:

• Consider adding more context and background information
• Include relevant examples or case studies from your substrate
• Add connections to related insights and patterns
• Expand on key concepts with more detailed explanations

*This is a placeholder enhancement. Full AI enhancement capabilities are being developed.*`;

  return currentContent + enhancement;
}