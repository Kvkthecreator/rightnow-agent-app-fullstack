'use client'

import { usePathname } from 'next/navigation';
import DumpModal from './DumpModal';
import useDumpHotkey from '@/lib/hooks/useDumpHotkey';

export default function DumpModalWrapper() {
  const pathname = usePathname();
  // Extract basket ID from URL like /baskets/[id]/...
  const match = pathname?.match(/\/baskets\/([^\/]+)/);
  const currentBasketId = match?.[1] || null;

  useDumpHotkey();
  if (!currentBasketId) return null;
  return <DumpModal basketId={currentBasketId} />;
}
