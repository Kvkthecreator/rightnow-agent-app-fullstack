'use client';

import { Input } from '@/components/ui/Input';

interface IntentFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function IntentField({ value, onChange }: IntentFieldProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="What are you working on right now?"
      className="text-2xl"
      autoFocus
    />
  );
}

