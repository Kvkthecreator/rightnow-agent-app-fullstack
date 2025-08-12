'use client'

import DumpModal from '@/components/DumpModal';
import useDumpHotkey from '@/lib/hooks/useDumpHotkey';
import { useBasket } from '@/lib/context/BasketContext';

export default function DumpModalWrapper() {
  const { currentBasketId } = useBasket();
  useDumpHotkey();
  if (!currentBasketId) return null;
  return <DumpModal basketId={currentBasketId} />;
}
