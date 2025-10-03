import { BasketProvider } from '@/contexts/BasketContext';
import { BasketModeProvider } from '@/basket-modes/provider';
import type { BasketModeConfig } from '@/basket-modes/types';
import type { ReactNode } from 'react';

interface Basket {
  id: string;
  name: string | null;
  description?: string | null;
  status?: string | null;
  created_at: string;
  last_activity_ts?: string | null;
  workspace_id: string;
  tags?: string[] | null;
  origin_template?: string | null;
  mode?: string | null;
}

interface BasketWrapperProps {
  children: ReactNode;
  basket: Basket;
  modeConfig?: BasketModeConfig;
}

/**
 * Wraps basket pages with the full BasketProvider context
 * Provides basket state to all child components
 */
export function BasketWrapper({ children, basket, modeConfig }: BasketWrapperProps) {
  return (
    <BasketModeProvider mode={basket.mode} config={modeConfig}>
      <BasketProvider initialBasket={basket}>
        {children}
      </BasketProvider>
    </BasketModeProvider>
  );
}
