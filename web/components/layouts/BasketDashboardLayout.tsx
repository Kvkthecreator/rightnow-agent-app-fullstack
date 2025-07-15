import DocumentList from "@/components/documents/DocumentList";
import BasketSidebar from "@/components/basket/BasketSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
  dumpBody?: string;
}

export default function BasketDashboardLayout({
  basketId,
  basketName,
  status,
  scope,
  dumpBody,
}: Props) {
  return (
    <div className="flex h-full w-full">
      <BasketSidebar
        basketId={basketId}
        basketName={basketName}
        status={status}
        scope={scope}
      />
      <div className="md:flex w-full min-h-screen flex-1 overflow-y-auto">
        {/* Sidebar document list for desktop */}
        <aside className="hidden md:block w-[220px] shrink-0 border-r overflow-y-auto">
          <div className="flex flex-col h-full">
            <DocumentList basketId={basketId} />
            <div className="p-4 border-t">
              <Button size="sm" disabled className="w-full">
                + Create Document
              </Button>
            </div>
          </div>
        </aside>
        {/* Main dashboard content */}
        <div className="flex-1 p-4 space-y-6">
          {/* Mobile document list */}
          <section className="md:hidden">
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
          <h2 className="font-medium mb-2">Blocks</h2>
          <Card className="p-4 text-sm">
            <EmptyState title="No blocks yet." />
          </Card>
        </section>

        <section>
          <h2 className="font-medium mb-2">Context</h2>
          <Card className="p-4 text-sm">
            <EmptyState title="Add context to guide your basket." />
          </Card>
        </section>

        <section>
          <h2 className="font-medium mb-2">Outputs</h2>
          <Card className="p-4 text-sm">
            <EmptyState title="No outputs yet." />
          </Card>
        </section>

        <section>
          <h2 className="font-medium mb-2">Latest Dump</h2>
          <Card className="p-4 whitespace-pre-wrap text-sm">
            {dumpBody ? dumpBody : "No dumps yet."}
          </Card>
        </section>
        </div>
      </div>
    </div>
  );
}
