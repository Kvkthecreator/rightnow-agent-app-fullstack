"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type NavCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const Ctx = createContext<NavCtx | null>(null);

const storageKey = (basketId?: string) => `yarnnn.navOpen.${basketId ?? "global"}`;

export function NavStateProvider({
  children,
  basketId,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  basketId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(basketId));
      if (saved !== null) setOpen(saved === "1");
    } catch {}
  }, [basketId]);

  const setAndPersist = useCallback(
    (v: boolean) => {
      setOpen(v);
      try {
        localStorage.setItem(storageKey(basketId), v ? "1" : "0");
      } catch {}
    },
    [basketId]
  );

  const toggle = useCallback(() => setAndPersist(!open), [open, setAndPersist]);

  return (
    <Ctx.Provider value={{ open, setOpen: setAndPersist, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNavState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNavState must be used within NavStateProvider");
  return ctx;
}
