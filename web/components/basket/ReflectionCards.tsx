"use client";

export function ReflectionCards({
  pattern,
  tension,
  question,
}: {
  pattern?: string;
  tension?: { a: string; b: string } | string | null;
  question?: string | null;
}) {
  const hasPattern = !!pattern?.trim();
  const hasTension = !!(tension && (typeof tension === 'string' ? tension.trim() : (tension.a && tension.b)));
  const hasQuestion = !!question?.trim();
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
          <p className="text-sm text-muted-foreground">
            {typeof tension === 'string' ? tension : `${tension!.a} vs ${tension!.b}`}
          </p>
        </div>
      )}
      {hasQuestion && (
        <div className="p-3 border rounded">
          <h3 className="font-medium">Question</h3>
          <p className="text-sm text-muted-foreground">{question}</p>
        </div>
      )}
    </div>
  );
}
