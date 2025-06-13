import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServerClient';

// GET /api/baskets/:id/commits
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('basket_commits')
    .select('*')
    .eq('basket_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
