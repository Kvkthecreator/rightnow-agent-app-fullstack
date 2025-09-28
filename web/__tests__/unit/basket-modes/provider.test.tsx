import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getModeConfig } from '@/basket-modes';
import { BasketModeProvider, useBasketMode } from '@/basket-modes/provider';

describe('basket modes registry', () => {
  it('falls back to default config when mode not provided', () => {
    const config = getModeConfig(undefined);
    expect(config.id).toBe('default');
  });

  it('returns specific configuration for known modes', () => {
    expect(getModeConfig('product_brain').id).toBe('product_brain');
    expect(getModeConfig('campaign_brain').id).toBe('campaign_brain');
  });

  it('returns default config for unknown ids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(getModeConfig('mystery').id).toBe('default');
    warn.mockRestore();
  });

  it('exposes mode id through context provider', () => {
    let captured: string | null = null;

    const Probe = () => {
      const { modeId } = useBasketMode();
      captured = modeId;
      return null;
    };

    renderToStaticMarkup(
      <BasketModeProvider mode="campaign_brain">
        <Probe />
      </BasketModeProvider>,
    );

    expect(captured).toBe('campaign_brain');
  });
});
