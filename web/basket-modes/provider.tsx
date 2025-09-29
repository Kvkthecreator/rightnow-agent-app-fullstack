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
  config,
  children,
}: {
  mode?: string | null;
  config?: BasketModeConfig;
  children: ReactNode;
}) {
  const resolved = useMemo(() => {
    if (config) return config;
    return getModeConfig(mode);
  }, [mode, config]);

  return (
    <BasketModeContext.Provider value={{ modeId: resolved.id, config: resolved }}>
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
