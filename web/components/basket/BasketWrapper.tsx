import { BasketProvider } from '@/contexts/BasketContext';
import { BasketModeProvider } from '@/basket-modes/provider';
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
}

/**
 * Wraps basket pages with the full BasketProvider context
 * Provides maturity data and basket state to all child components
 */
export function BasketWrapper({ children, basket }: BasketWrapperProps) {
  return (
    <BasketModeProvider mode={basket.mode}>
      <BasketProvider initialBasket={basket}>
        {children}
      </BasketProvider>
    </BasketModeProvider>
  );
}
