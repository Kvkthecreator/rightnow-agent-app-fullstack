'use client';

interface ReflectionCardsProps {
  pattern?: string;
  tension?: string;
  question?: string;
  why?: string[];
}

export default function ReflectionCards({
  pattern,
  tension,
  question,
  why = [],
}: ReflectionCardsProps) {
  const hasPattern = !!pattern?.trim();
  const hasTension = !!tension?.trim();
  const hasQuestion = !!question?.trim();
  const cleanWhy = why.filter((w) => w.trim());
  return (
    <div className="space-y-2">
      {hasPattern && (
        <div className="p-3 border rounded">
          <h3 className="font-medium">Pattern</h3>
          <p className="text-sm text-muted-foreground">{pattern}</p>
        </div>
      )}
      {hasTension && (
        <div className="p-3 border rounded">
          <h3 className="font-medium">Tension</h3>
          <p className="text-sm text-muted-foreground">{tension}</p>
        </div>
      )}
      {hasQuestion && (
        <div className="p-3 border rounded">
          <h3 className="font-medium">Question</h3>
          <p className="text-sm text-muted-foreground">{question}</p>
        </div>
      )}
      {cleanWhy.length > 0 && (
        <div className="p-3 border rounded">
          <h3 className="font-medium">Why?</h3>
          <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
            {cleanWhy.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
