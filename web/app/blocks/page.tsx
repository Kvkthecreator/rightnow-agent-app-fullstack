"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import Shell from "@/components/layouts/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import BlockCard, { Block } from "@/components/blocks/BlockCard";
import BlockCreateModal from "@/components/blocks/BlockCreateModal";
import { fetchBlocks, createBlock, toggleAuto } from "@/lib/supabase/blocks";

export default function BlocksPage() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'core'>('all');

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      localStorage.setItem("postLoginRedirect", window.location.pathname);
      router.replace("/login");
      return;
    }
    (async () => {
      const { data } = await fetchBlocks(session.user.id, filter === 'core');
      if (data) setBlocks(data as any);
    })();
  }, [session, isLoading, router, filter]);

  async function handleCreate(data: {
    type: string;
    label: string;
    content: string;
    auto: boolean;
  }) {
    if (!session?.user) return;
    setLoading(true);
    const { data: created } = await createBlock({
      user_id: session.user.id,
      type: data.type,
      label: data.label,
      content: data.content,
      update_policy: data.auto ? "auto" : "manual",
      is_core_block: false,
    });
    if (created) setBlocks((b) => [created as Block, ...b]);
    setLoading(false);
  }

  async function handleToggle(id: string, enable: boolean) {
    await toggleAuto(id, enable);
    setBlocks((b) =>
      b.map((blk) =>
        blk.id === id ? { ...blk, update_policy: enable ? "auto" : "manual" } : blk
      )
    );
  }

  if (isLoading) return null;

  return (
    <Shell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🧱 Context Blocks</h1>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === "core" ? "default" : "outline"}
              onClick={() => setFilter("core")}
            >
              Core
            </Button>
            <Button onClick={() => setShowModal(true)}>+ Create Block</Button>
          </div>
        </div>
        <Card>
          <p className="text-sm text-muted-foreground">
            Modular context units like tone, audience and positioning.
          </p>
        </Card>
        <div className="space-y-4">
          {blocks
            .filter((b) => (filter === "core" ? b.is_core_block : true))
            .map((b) => (
              <BlockCard key={b.id} block={b} onToggleAuto={handleToggle} />
            ))}
        </div>
        {/* TODO: pending review queue and diff view */}
        <BlockCreateModal
          open={showModal}
          onOpenChange={setShowModal}
          onCreate={handleCreate}
        />
      </div>
    </Shell>
  );
}
