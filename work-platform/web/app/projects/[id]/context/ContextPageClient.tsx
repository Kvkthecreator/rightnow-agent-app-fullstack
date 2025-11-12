"use client";

import ContextBlocksClient from "./ContextBlocksClient";

interface ContextPageClientProps {
  projectId: string;
  basketId: string;
}

export default function ContextPageClient({ projectId, basketId }: ContextPageClientProps) {
  return (
    <ContextBlocksClient
      projectId={projectId}
      basketId={basketId}
    />
  );
}

// Export separate component for Add Context button to be used in header
export { default as AddContextButton } from "./AddContextButton";
