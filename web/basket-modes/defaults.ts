import { defaultMode } from './default';
import { productBrainMode } from './productBrain';
import { campaignBrainMode } from './campaignBrain';
import type { BasketModeConfig, BasketModeId } from './types';

export const DEFAULT_MODE_CONFIGS: Record<BasketModeId, BasketModeConfig> = {
  default: defaultMode,
  product_brain: productBrainMode,
  campaign_brain: campaignBrainMode,
};
