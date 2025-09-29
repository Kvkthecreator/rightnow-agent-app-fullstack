import type { BasketModeConfig, BasketModeId } from './types';
import { DEFAULT_MODE_CONFIGS } from './defaults';

export function getModeConfig(mode?: string | null): BasketModeConfig {
  if (!mode) {
    return DEFAULT_MODE_CONFIGS.default;
  }
  if (mode in DEFAULT_MODE_CONFIGS) {
    return DEFAULT_MODE_CONFIGS[mode as BasketModeId];
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[basket-modes] Unknown mode "${mode}". Falling back to default.`);
  }
  return DEFAULT_MODE_CONFIGS.default;
}

export { DEFAULT_MODE_CONFIGS as BASKET_MODES };
export type { BasketModeConfig, BasketModeId } from './types';
