'use client';

interface TodayReflectionCardProps {
  line?: string;
  fallback: string;
}

export default function TodayReflectionCard({
  line,
  fallback,
}: TodayReflectionCardProps) {
  const text = line?.trim() || fallback;
  if (!text) return null;
  return (
    <div className="p-4 border rounded bg-card text-card-foreground">
      <p className="text-sm">{text}</p>
    </div>
  );
}
