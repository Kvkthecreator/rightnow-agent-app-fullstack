'use client';

import { Input } from '@/components/ui/Input';

interface IntentFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function IntentField({ value, onChange }: IntentFieldProps) {
  return (
    <Input
      type="text"
      placeholder="What are you working on right now?"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-2xl font-light bg-transparent border-b border-gray-800 focus:border-white transition-colors pb-2"
      autoFocus
    />
  );
}

