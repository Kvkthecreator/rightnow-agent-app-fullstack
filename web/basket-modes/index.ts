import type { BasketModeConfig, BasketModeId } from './types';
import { defaultMode } from './default';
import { productBrainMode } from './productBrain';
import { campaignBrainMode } from './campaignBrain';

export const BASKET_MODES: Record<BasketModeId, BasketModeConfig> = {
  default: defaultMode,
  product_brain: productBrainMode,
  campaign_brain: campaignBrainMode,
};

export function getModeConfig(mode?: string | null): BasketModeConfig {
  if (!mode) {
    return BASKET_MODES.default;
  }
  if (mode in BASKET_MODES) {
    return BASKET_MODES[mode as BasketModeId];
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[basket-modes] Unknown mode "${mode}". Falling back to default.`);
  }
  return BASKET_MODES.default;
}

export type { BasketModeConfig, BasketModeId } from './types';
