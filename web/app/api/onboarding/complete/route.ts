import { NextResponse } from 'next/server';
import { OnboardingSubmitSchema } from '@shared/contracts/onboarding';
import { apiPost } from '@/lib/server/http';

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const payload = OnboardingSubmitSchema.parse(raw);

    const r = await apiPost('/api/baskets/resolve', {
      create_if_missing: true,
      basket_id: payload.basket_id,
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: 'baskets.resolve_failed', detail: txt }, { status: r.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.status === 401 || err?.message === 'NO_TOKEN') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'internal_error', detail: String(err?.message ?? err) }, { status: 500 });
  }
}
