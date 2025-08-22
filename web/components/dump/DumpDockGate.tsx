'use client';
import { usePathname } from 'next/navigation';
import DumpBarDock from './DumpBarDock';

export default function DumpDockGate({ basketId }: { basketId: string }) {
  const p = usePathname() ?? '';
  const onMemory = /\/baskets\/[^/]+\/memory(?:$|\?)/.test(p);
  return <DumpBarDock basketId={basketId} defaultOpen={onMemory} />;
}
