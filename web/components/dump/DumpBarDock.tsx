"use client";

import { useState, useEffect } from "react";
import DumpBarPanel from "./DumpBarPanel";

interface Props {
  basketId: string;
}

export default function DumpBarDock({ basketId }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="rounded-full bg-black text-white px-4 py-3 shadow-lg flex items-center space-x-2"
        >
          <span>Capture</span>
          <kbd className="text-xs opacity-70">⌥V</kbd>
        </button>
      </div>
      {open && <DumpBarPanel basketId={basketId} onClose={() => setOpen(false)} />}
    </>
  );
}
