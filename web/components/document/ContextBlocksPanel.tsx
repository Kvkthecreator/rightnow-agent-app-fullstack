"use client";

import { useState } from "react";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import ContextPanel from "@/components/context/ContextPanel";
import type { Block, ContextItem } from "@/types";
import { apiClient } from "@/lib/api/client";
import {
  createContextItem,
  updateContextItem,
} from "@/lib/contextItems";

interface BlockRow extends Block {
  state: string;
  scope?: string | null;
}

interface Props {
  basketId: string;
  documentId?: string;
  blocks: BlockRow[];
  contextItems: ContextItem[];
}

export default function ContextBlocksPanel({
  basketId,
  documentId,
  blocks: initialBlocks,
  contextItems: initialItems,
}: Props) {
  const showContext = useFeatureFlag("showContextPanel", true);
  const [blocks, setBlocks] = useState<BlockRow[]>(initialBlocks ?? []);
  const [items, setItems] = useState<ContextItem[]>(initialItems ?? []);

  async function handleDeleteBlock(id: string) {
    if (!window.confirm("Are you sure you want to delete this block?")) return;
    setBlocks((b) => b.filter((blk) => blk.id !== id));
  }

  async function handleEditBlock(block: BlockRow) {
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
    const content = window.prompt("Edit content", it.summary);
    if (content === null) return;
    await updateContextItem(it.id, { summary: content });
    setItems((arr) => arr.map((i) => (i.id === it.id ? { ...i, summary: content } : i)));
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
      summary: content,
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
                <span>{it.summary}</span>
                <span className="space-x-2">
                  <label className="text-xs">
                    ✔ Verified
                    {/* TODO: Legacy patch. Remove `as any` after type refactor. */}
                    <input
                      type="checkbox"
                      className="ml-1"
                      checked={(it as any).status === "verified"}
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
              {/* TODO: Legacy patch. Remove `as any` after type refactor. */}
              {(b as any).state !== "LOCKED" && (
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
