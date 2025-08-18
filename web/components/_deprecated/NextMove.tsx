/** @deprecated Unused. Candidate for removal post-launch. */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface ProposalItem {
  delta_id: string;
  kind: string;
  target: { type: string; id: string; title: string };
  summary: string;
  preview_before: string;
  preview_after: string;
}

interface NextMoveProps {
  items: ProposalItem[];
}

export default function NextMove({ items }: NextMoveProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No proposals</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <Card key={p.delta_id}>
          <CardHeader>
            <CardTitle>{p.summary}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{p.target.title}</p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.preview_after}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
