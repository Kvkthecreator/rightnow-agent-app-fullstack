export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { ensureWorkspaceForUser } from '@/lib/workspaces/ensureWorkspaceForUser';
import { 
  CANONICAL_TEXT_MIME_TYPES, 
  CANONICAL_BINARY_MIME_TYPES, 
  SUPPORTED_FORMAT_DESCRIPTION,
  isCanonicalFile,
  getCanonicalMimeType,
  isCanonicalTextFormat,
  isCanonicalBinaryFormat
} from '@/shared/constants/canonical_file_types';

// Universal Work Initiation Helper for Canon v2.1 compliance
async function initiateUniversalWork(
  supabase: any,
  workType: string,
  payload: any,
  context: {
    user_id: string;
    workspace_id: string;
    basket_id?: string;
    dump_id?: string;
  },
  priority: number = 5
): Promise<string> {
  const work_id = crypto.randomUUID();
  
  const workEntry = {
    id: work_id,
    work_id: work_id,
    work_type: workType,
    user_id: context.user_id,
    workspace_id: context.workspace_id,
    basket_id: context.basket_id,
    dump_id: context.dump_id,
    processing_state: 'pending',
    priority: priority,
    work_payload: payload,
    cascade_metadata: {}
  };

  const { data, error } = await supabase
    .table('agent_processing_queue')
    .insert(workEntry);

  if (error) {
    throw new Error(`Failed to create work entry: ${error.message}`);
  }

  // Emit timeline event
  try {
    await supabase.table('timeline_events').insert({
      id: crypto.randomUUID(),
      workspace_id: context.workspace_id,
      basket_id: context.basket_id,
      kind: 'work.initiated',
      ref_id: work_id,
      preview: `${workType.replace('_', ' ')} work initiated`,
      payload: {
        work_id: work_id,
        work_type: workType,
        user_id: context.user_id
      }
    });
  } catch (e) {
    // Timeline event failure shouldn't break work creation
    console.warn('Failed to emit timeline event:', e);
  }

  return work_id;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const basket_id = formData.get('basket_id') as string;
    const dump_request_id = formData.get('dump_request_id') as string;
    const metaStr = formData.get('meta') as string;
    const meta = metaStr ? JSON.parse(metaStr) : {};

    if (!file || !basket_id || !dump_request_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, basket_id, dump_request_id' 
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { userId } = await getAuthenticatedUser(supabase);
    const workspace = await ensureWorkspaceForUser(userId, supabase);

    // Validate basket access
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select('id, workspace_id')
      .eq('id', basket_id)
      .eq('workspace_id', workspace.id)
      .single();

    if (basketError || !basket) {
      return NextResponse.json({ error: 'Basket access denied' }, { status: 403 });
    }

    // Validate file is canonical
    if (!isCanonicalFile(file)) {
      return NextResponse.json({ 
        error: 'Unsupported file type',
        details: SUPPORTED_FORMAT_DESCRIPTION,
        received_type: file.type,
        file_name: file.name
      }, { status: 400 });
    }

    // Get canonical MIME type (handles extension-based detection)
    const canonicalMimeType = getCanonicalMimeType(file) || file.type;

    // Process file content based on canonical supported types
    let fileContent = '';
    let fileUrl = '';
    
    if (isCanonicalTextFormat(canonicalMimeType)) {
      // Read text content directly for canonical text types
      fileContent = await file.text();
    } else if (isCanonicalBinaryFormat(canonicalMimeType)) {
      // Upload to Supabase Storage for canonical file types (PDF/images)
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileName = `dumps/${basket_id}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('raw-dumps')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        });
      
      if (uploadError) {
        return NextResponse.json({ 
          error: 'Failed to upload file to storage',
          details: uploadError.message 
        }, { status: 500 });
      }
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('raw-dumps')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
      // Content will be extracted by P0 Capture Agent using ContentExtractor
      fileContent = '';
    }

    // Create raw_dump via RPC
    const { data: dumpResult, error: dumpError } = await supabase
      .rpc('fn_ingest_dumps', {
        p_workspace_id: workspace.id,
        p_basket_id: basket_id,
        p_dumps: [{
          dump_request_id,
          text_dump: fileContent || null,
          file_url: fileUrl || null,
          source_meta: {
            ...meta,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type,
            upload_method: 'api_upload'
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

    return NextResponse.json({
      success: true,
      dump_id: dumpResult?.[0]?.dump_id,
      message: 'File uploaded and processed',
      processing_method: fileContent ? 'immediate_text' : 'storage_extraction'
    }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}