'use client';
import React, { createContext, useContext, useState } from 'react';

export type Focus =
  | { kind: 'dashboard' }
  | { kind: 'document'; id: string; selection?: { start:number; end:number } }
  | { kind: 'block'; id: string }
  | { kind: 'context_item'; id: string };

const Ctx = createContext<{ focus: Focus; setFocus: (f: Focus) => void } | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focus, setFocus] = useState<Focus>({ kind: 'dashboard' });
  return <Ctx.Provider value={{ focus, setFocus }}>{children}</Ctx.Provider>;
}
export function useFocus() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFocus must be used within FocusProvider');
  return v;
}
