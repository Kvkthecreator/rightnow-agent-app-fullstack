'use client'

import DumpModal from './DumpModal';
import useDumpHotkey from '@/lib/hooks/useDumpHotkey';

export default function DumpModalWrapper() {
  useDumpHotkey();
  return <DumpModal />;
}
