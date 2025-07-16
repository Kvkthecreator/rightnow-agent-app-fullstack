"use client";

import { useState } from "react";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import ContextPanel, { ContextItem } from "@/components/context/ContextPanel";
import { apiDelete, apiPut } from "@/lib/api";
import {
  createContextItem,
  updateContextItem,
} from "@/lib/contextItems";

interface Block {
  id: string;
  content: string;
  state: string;
  scope?: string | null;
}

interface Props {
  basketId: string;
  documentId?: string;
  blocks: Block[];
  contextItems: ContextItem[];
}

export default function ContextBlocksPanel({
  basketId,
  documentId,
  blocks: initialBlocks,
  contextItems: initialItems,
}: Props) {
  const showContext = useFeatureFlag("showContextPanel", true);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks ?? []);
  const [items, setItems] = useState<ContextItem[]>(initialItems ?? []);

  async function handleDeleteBlock(id: string) {
    if (!window.confirm("Are you sure you want to delete this block?")) return;
    setBlocks((b) => b.filter((blk) => blk.id !== id));
  }

  async function handleEditBlock(block: Block) {
    const content = window.prompt("Edit block text", block.content);
    if (content === null) return;
    const scope = window.prompt("Scope", block.scope || "") || null;
    setBlocks((b) =>
      b.map((blk) => (blk.id === block.id ? { ...blk, content, scope } : blk)),
    );
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
    const res = await createContextItem({
      basket_id: basketId,
      document_id: documentId ?? null,
      type,
      content,
      status: "active",
    });
    setItems((arr) => [...arr, res as any]);
  }

  return (
    <div className="right-panel space-y-4">
      {showContext && (
        <div className="p-2">
          <button onClick={handleAdd} className="mb-2 text-sm text-primary">
            + Add Context Item
          </button>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No context items.</div>
          ) : (
            items.map((it) => (
              <div
                key={it.id}
                className="border rounded p-2 mb-2 flex justify-between text-sm"
              >
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
      )}
      <div>
        {blocks.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2">No blocks.</div>
        ) : (
          blocks.map((b) => (
            <div
              key={b.id}
              className="border rounded p-2 mb-2 text-sm flex justify-between"
            >
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
    </div>
  );
}
