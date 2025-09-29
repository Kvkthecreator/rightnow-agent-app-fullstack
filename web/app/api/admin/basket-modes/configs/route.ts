import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/clients';
import { loadBasketModeConfigs } from '@/basket-modes/loader';
import { ZodError } from 'zod';
import { basketModeConfigSchema } from '@/basket-modes/schema';
import type { BasketModeId } from '@/basket-modes/types';
import { DEFAULT_MODE_CONFIGS } from '@/basket-modes/defaults';
import {
  credentialsConfigured,
  getAdminCookieName,
  isValidAdminSession,
} from '@/lib/admin/auth';

const TABLE = 'basket_mode_configs';

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export async function GET() {
  if (!credentialsConfigured()) {
    return NextResponse.json({ error: 'admin_credentials_missing' }, { status: 500 });
  }

  const sessionToken = cookies().get(getAdminCookieName())?.value;
  if (!isValidAdminSession(sessionToken)) {
    return unauthorized();
  }

  const configs = await loadBasketModeConfigs();
  return NextResponse.json({ configs });
}

export async function PUT(request: NextRequest) {
  if (!credentialsConfigured()) {
    return NextResponse.json({ error: 'admin_credentials_missing' }, { status: 500 });
  }

  const sessionToken = cookies().get(getAdminCookieName())?.value;
  if (!isValidAdminSession(sessionToken)) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const modeId = body?.mode_id as string | undefined;
  const configPayload = body?.config;
  const updatedBy = body?.updated_by as string | undefined;

  if (!modeId || !configPayload) {
    return NextResponse.json({ error: 'mode_id_and_config_required' }, { status: 400 });
  }

  if (!(modeId in DEFAULT_MODE_CONFIGS)) {
    return NextResponse.json({ error: 'unknown_mode', mode_id: modeId }, { status: 400 });
  }

  let parsed;
  try {
    parsed = basketModeConfigSchema.parse({ ...configPayload, id: modeId });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'invalid_config', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'invalid_config', details: String(error) }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert({
      mode_id: modeId as BasketModeId,
      config: parsed,
      updated_by: updatedBy ?? 'admin',
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[basket-modes] Failed to persist config', error.message);
    return NextResponse.json({ error: 'persist_failed', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: parsed });
}
