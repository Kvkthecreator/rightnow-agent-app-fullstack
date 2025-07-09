"use client";

import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import ContextPanel, { ContextItem } from "./ContextPanel";
import BlocksPane from "@/components/blocks/BlocksPane";

export default function ContextBlocksPanel({
  blocks,
  contextItems,
}: {
  blocks: any[];
  contextItems: ContextItem[];
}) {
  const showContext = useFeatureFlag("showContextPanel", true);

  return (
    <div className="right-panel">
      {showContext && <ContextPanel items={contextItems} />}
      <BlocksPane blocks={blocks} />
    </div>
  );
}

