"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import ContextPanel, { ContextItem } from "@/components/context/ContextPanel";
import { createContextItem, updateContextItem, deleteContextItem } from "@/lib/contextItems";
import { apiDelete, apiPut } from "@/lib/api";

interface Block {
  id: string;
  content: string;
  state: string;
  scope?: string | null;
}

export default function RightPanelTabs({
  basketId,
  blocks: initialBlocks,
  contextItems: initialItems,
}: {
  basketId: string;
  blocks: Block[];
  contextItems: ContextItem[];
}) {
  const [tab, setTab] = useState("context");
  const [blocks, setBlocks] = useState(initialBlocks);
  const [items, setItems] = useState(initialItems);

  async function handleDeleteBlock(id: string) {
    if (!window.confirm("Are you sure you want to delete this block?")) return;
    await apiDelete(`/api/blocks/${id}`);
    setBlocks((b) => b.filter((blk) => blk.id !== id));
    console.log("log_event", "block_deleted", { id });
  }

  async function handleEditBlock(block: Block) {
    const content = window.prompt("Edit block text", block.content);
    if (content === null) return;
    const scope = window.prompt("Scope", block.scope || "") || null;
    const res = await apiPut(`/api/blocks/${block.id}`, { content, scope });
    setBlocks((b) => b.map((blk) => (blk.id === block.id ? { ...blk, content, scope } : blk)));
    console.log("log_event", "block_updated", res);
  }

  async function handleToggleItem(it: ContextItem, verified: boolean) {
    const status = verified ? "verified" : "active";
    await updateContextItem(it.id, { status });
    setItems((arr) => arr.map((i) => (i.id === it.id ? { ...i, status } : i)));
  }

  async function handleEditItem(it: ContextItem) {
    const content = window.prompt("Edit content", it.content);
    if (content === null) return;
    await updateContextItem(it.id, { content });
    setItems((arr) => arr.map((i) => (i.id === it.id ? { ...i, content } : i)));
  }

  async function handleAdd() {
    const type = window.prompt("Type", "guideline");
    if (!type) return;
    const content = window.prompt("Content");
    if (!content) return;
    const res = await createContextItem({ basket_id: basketId, type, content, status: "active" });
    setItems((arr) => [...arr, res as any]);
  }

  return (
    <Tabs value={tab} onValueChange={setTab} defaultValue="context" className="w-full">
      <TabsList className="grid grid-cols-2 m-2">
        <TabsTrigger value="context">Context</TabsTrigger>
        <TabsTrigger value="blocks">Blocks</TabsTrigger>
      </TabsList>
      <TabsContent value="context">
        <div className="p-2">
          <Button size="sm" onClick={handleAdd} className="mb-2">
            + Add Context Item
          </Button>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No context items.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="border rounded p-2 mb-2 flex justify-between text-sm">
                <span>{it.content}</span>
                <span className="space-x-2">
                  <label className="text-xs">
                    ✔ Verified
                    <input
                      type="checkbox"
                      className="ml-1"
                      checked={it.status === "verified"}
                      onChange={(e) => handleToggleItem(it, e.target.checked)}
                    />
                  </label>
                  <button onClick={() => handleEditItem(it)}>✏️</button>
                </span>
              </div>
            ))
          )}
        </div>
      </TabsContent>
      <TabsContent value="blocks">
        <div className="p-2">
          {blocks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No blocks.</div>
          ) : (
            blocks.map((b) => (
              <div key={b.id} className="border rounded p-2 mb-2 text-sm flex justify-between">
                <span>{b.content.slice(0, 80)}</span>
                {b.state !== "LOCKED" && (
                  <span className="space-x-2">
                    <button onClick={() => handleEditBlock(b)}>✏️</button>
                    <button onClick={() => handleDeleteBlock(b.id)}>🗑</button>
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
