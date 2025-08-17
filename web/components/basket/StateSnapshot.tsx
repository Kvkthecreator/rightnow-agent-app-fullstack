import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface StateSnapshotProps {
  state: {
    name: string;
    counts: { documents: number; blocks: number; context_items: number };
    last_updated: string;
    current_focus: string;
  };
}

export default function StateSnapshot({ state }: StateSnapshotProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{state.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(state.last_updated).toLocaleString()}
        </p>
        <p className="mt-2">
          Documents: {state.counts.documents} · Blocks: {state.counts.blocks} ·
          Context items: {state.counts.context_items}
        </p>
        <p className="mt-2">{state.current_focus}</p>
      </CardContent>
    </Card>
  );
}
