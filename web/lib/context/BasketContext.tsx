"use client";
import { createContext, useContext, useState } from "react";

interface BasketCtx {
  currentBasketId: string | null;
  setCurrentBasketId: (id: string | null) => void;
}

const BasketContext = createContext<BasketCtx>({
  currentBasketId: null,
  setCurrentBasketId: () => {},
});

export function BasketProvider({ children, initialId }: { children: React.ReactNode; initialId?: string | null }) {
  const [currentBasketId, setCurrentBasketId] = useState<string | null>(initialId ?? null);
  return (
    <BasketContext.Provider value={{ currentBasketId, setCurrentBasketId }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
