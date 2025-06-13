import { getSupabaseAdmin } from '@/lib/supabaseServerClient';

// GET /api/baskets/:id/commits
export async function GET(
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  const { params } = context;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('basket_commits')
    .select('*')
    .eq('basket_id', params.id)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
