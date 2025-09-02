export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const document_id = formData.get('document_id') as string;
    const dump_request_id = formData.get('dump_request_id') as string;

    if (!file || !document_id || !dump_request_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, document_id, dump_request_id' 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Get document and validate access
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, basket_id, title')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Validate basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', document.basket_id)
      .eq('workspace_id', workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket access denied' }, { status: 403 });
    }

    // Process file content based on type
    let fileContent = '';
    let fileUrl = '';
    
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      // Read text content directly
      fileContent = await file.text();
    } else {
      // For PDFs, images, etc., we'd typically upload to storage and store URL
      // For now, store basic file info and simulate file processing
      fileContent = `Uploaded file: ${file.name} (${file.type}, ${file.size} bytes)`;
      fileUrl = `placeholder://uploads/${document_id}/${file.name}`;
    }

    // Create raw_dump linked to document
    const { data: dumpResult, error: dumpError } = await supabase
      .rpc('fn_ingest_dumps', {
        p_workspace_id: workspace.id,
        p_basket_id: document.basket_id,
        p_dumps: [{
          dump_request_id,
          text_dump: fileContent,
          file_url: fileUrl || null,
          source_meta: {
            linked_document_id: document_id,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type,
            upload_method: 'document_upload'
          }
        }]
      });

    if (dumpError) {
      console.error('Dump creation error:', dumpError);
      return NextResponse.json({ 
        error: 'Failed to create dump from file',
        details: dumpError.message 
      }, { status: 500 });
    }

    // Update document with content
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        content_raw: fileContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Document update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update document content',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document_id,
      dump_ids: dumpResult,
      message: 'Document uploaded and processed'
    }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}