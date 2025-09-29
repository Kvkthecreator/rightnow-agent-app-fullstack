import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/clients';
import type { BasketModeConfig, BasketModeId } from './types';
import { DEFAULT_MODE_CONFIGS } from './defaults';
import { basketModeConfigSchema } from './schema';

const TABLE = 'basket_mode_configs';

export async function loadBasketModeConfigs(): Promise<Record<BasketModeId, BasketModeConfig>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('mode_id, config');

  if (error) {
    console.error('[basket-modes] Failed to fetch configs from Supabase:', error.message);
    return DEFAULT_MODE_CONFIGS;
  }

  const merged = { ...DEFAULT_MODE_CONFIGS } as Record<BasketModeId, BasketModeConfig>;

  for (const row of data ?? []) {
    if (!row?.mode_id || !row?.config) continue;
    if (!(row.mode_id in merged)) continue;

    try {
      const parsed = basketModeConfigSchema.parse(row.config);
      merged[row.mode_id as BasketModeId] = parsed;
    } catch (parseError) {
      console.warn(
        `[basket-modes] Invalid config for ${row.mode_id}, falling back to defaults`,
        parseError,
      );
    }
  }

  return merged;
}

export async function loadBasketModeConfig(modeId: BasketModeId): Promise<BasketModeConfig> {
  const configs = await loadBasketModeConfigs();
  return configs[modeId] ?? DEFAULT_MODE_CONFIGS.default;
}
