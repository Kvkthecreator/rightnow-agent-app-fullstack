import DocumentList from "@/components/documents/DocumentList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  basketId: string;
  dumpBody?: string;
}

export default function BasketDashboardLayout({ basketId, dumpBody }: Props) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-medium mb-2">Documents</h2>
        <Card className="p-4">
          <DocumentList basketId={basketId} />
          <div className="pt-4">
            <Button size="sm" disabled className="w-full">
              + Create Document
            </Button>
          </div>
        </Card>
      </section>
      <section>
        <h2 className="font-medium mb-2">Latest Dump</h2>
        <Card className="p-4 whitespace-pre-wrap text-sm">
          {dumpBody ? dumpBody : "No dumps yet."}
        </Card>
      </section>
      {/* TODO: blocks and context cards */}
    </div>
  );
}
