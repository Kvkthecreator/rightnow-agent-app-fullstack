import { describe, it, expect } from 'vitest';
import { basketModeConfigSchema } from '@/basket-modes/schema';
import { DEFAULT_MODE_CONFIGS } from '@/basket-modes/defaults';

const CORE_ANCHOR_IDS = ['core_problem', 'core_customer', 'product_vision', 'success_metrics'];

describe('basket mode default configs', () => {
  it('all default configs satisfy schema', () => {
    for (const [modeId, config] of Object.entries(DEFAULT_MODE_CONFIGS)) {
      const parsed = basketModeConfigSchema.parse(config);
      expect(parsed.id).toBe(modeId);
    }
  });

  it('core anchors exist on every config', () => {
    for (const config of Object.values(DEFAULT_MODE_CONFIGS)) {
      const ids = config.anchors.core.map((anchor) => anchor.id);
      for (const coreId of CORE_ANCHOR_IDS) {
        expect(ids).toContain(coreId);
      }
    }
  });

  it('deliverables reference declared anchors', () => {
    for (const config of Object.values(DEFAULT_MODE_CONFIGS)) {
      const availableAnchors = new Set([
        ...config.anchors.core.map((a) => a.id),
        ...config.anchors.brain.map((a) => a.id),
      ]);
      config.deliverables.forEach((deliverable) => {
        deliverable.requiredAnchors.forEach((anchorId) => {
          expect(availableAnchors.has(anchorId)).toBe(true);
        });
        (deliverable.optionalAnchors ?? []).forEach((anchorId) => {
          if (!availableAnchors.has(anchorId)) {
            // Optional anchors may reference cross-brain anchors; log for visibility.
            console.warn(`Optional anchor ${anchorId} not present in ${config.id} anchor set`);
          }
        });
      });
    }
  });
});
