'use client';

interface IntentFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function IntentField({ value, onChange }: IntentFieldProps) {
  return (
    <input
      type="text"
      placeholder="What are you working on?"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light bg-transparent border-b border-gray-800 focus:border-white transition-colors pb-2 outline-none"
      autoFocus
    />
  );
}

