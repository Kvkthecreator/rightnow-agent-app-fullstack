"use client";
import DocumentList from "@/components/documents/DocumentList";
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
  dumpBody?: string;
  empty?: boolean;
  basketName?: string;
}

function EmptyPrompt({ basketId }: { basketId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Card className="p-4 text-center space-y-4">
      <p className="text-sm text-muted-foreground">
        👋 Start by adding a Block, Document, or Raw Dump.
      </p>
      <div className="flex justify-center gap-2">
        <Button size="sm" onClick={() => setOpen(true)}>+ Block</Button>
        <Button
          size="sm"
          disabled
          onClick={() => router.push(`/baskets/${basketId}/docs/new`)}
        >
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
            meta_tags:
              typeof d.meta_tags === "string"
                ? d.meta_tags.split(",").map((tag) => tag.trim())
                : d.meta_tags,
          });
        }}
        includeAuto={false}
      />
    </Card>
  );
}

export default function BasketDashboard({
  basketId,
  dumpBody,
  empty = false,
  basketName,
}: Props) {
  return (
    <div className="p-4 space-y-6">
      {basketName && (
        <h1 className="text-2xl font-bold">\uD83D\uDCCA Dashboard for {basketName}</h1>
      )}
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
  );
}
