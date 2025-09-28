"use client";

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getModeConfig } from './index';
import type { BasketModeConfig, BasketModeId } from './types';

export type BasketModeContextValue = {
  modeId: BasketModeId;
  config: BasketModeConfig;
};

const BasketModeContext = createContext<BasketModeContextValue | null>(null);

export function BasketModeProvider({
  mode,
  children,
}: {
  mode?: string | null;
  children: ReactNode;
}) {
  const config = useMemo(() => getModeConfig(mode), [mode]);

  return (
    <BasketModeContext.Provider value={{ modeId: config.id, config }}>
      {children}
    </BasketModeContext.Provider>
  );
}

export function useBasketMode(): BasketModeContextValue {
  const context = useContext(BasketModeContext);
  if (!context) {
    throw new Error('useBasketMode must be used within a BasketModeProvider');
  }
  return context;
}
