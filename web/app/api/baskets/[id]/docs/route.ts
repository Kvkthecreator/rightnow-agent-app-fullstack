import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, context: any) {
  const supabase = createServerClient();
  const { id } = context.params;

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, updated_at')
    .eq('basket_id', id)
    .order('created_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], { status: 200 });
}
