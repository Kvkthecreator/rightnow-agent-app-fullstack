"use client";
import DocumentList from "@/components/documents/DocumentList";
import BasketSidebar from "@/components/basket/BasketSidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import BlockCreateModal from "@/components/blocks/BlockCreateModal";
import { openDumpModal } from "@/components/DumpModal";
import { createBlock } from "@/lib/supabase/blocks";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  basketId: string;
  basketName: string;
  status: string;
  scope: string[];
  dumpBody?: string;
  empty?: boolean;
}

function EmptyPrompt({ basketId }: { basketId: string }) {
  "use client";
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Card className="p-4 text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        👋 Start by adding a Block, Document, or Raw Dump.
      </p>
      <div className="flex justify-center gap-2">
        <Button size="sm" onClick={() => setOpen(true)}>+ Block</Button>
        <Button size="sm" disabled onClick={() => router.push(`/baskets/${basketId}/docs/new`)}>
          + Document
        </Button>
        <Button size="sm" onClick={() => openDumpModal()}>+ Dump</Button>
      </div>
      <BlockCreateModal
        open={open}
        onOpenChange={setOpen}
        onCreate={async (d) => {
          await createBlock({
            basket_id: basketId,
            label: d.label,
            content: d.content,
            semantic_type: d.type,
            meta_tags: d.meta_tags,
          });
        }}
        includeAuto={false}
      />
    </Card>
  );
}

export default function BasketDashboardLayout({
  basketId,
  basketName,
  status,
  scope,
  dumpBody,
  empty = false,
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
          {empty && <EmptyPrompt basketId={basketId} />}
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
