"use client";

interface BasketInputLogProps {
  basketId: string;
}

export default function BasketInputLog({ basketId }: BasketInputLogProps) {
  return (
    <div className="text-muted-foreground">
      Placeholder for basket input log (basket {basketId})
    </div>
  );
}
