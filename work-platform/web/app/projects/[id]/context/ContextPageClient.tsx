"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileBox } from "lucide-react";
import ContextBlocksClient from "./ContextBlocksClient";
import ContextAssetsClient from "./ContextAssetsClient";

interface ContextPageClientProps {
  projectId: string;
  basketId: string;
}

export default function ContextPageClient({ projectId, basketId }: ContextPageClientProps) {
  const [activeTab, setActiveTab] = useState<"blocks" | "assets">("blocks");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "blocks" | "assets")} className="w-full">
      <TabsList className="grid w-full max-w-[400px] grid-cols-2">
        <TabsTrigger value="blocks" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Blocks
        </TabsTrigger>
        <TabsTrigger value="assets" className="flex items-center gap-2">
          <FileBox className="h-4 w-4" />
          Assets
        </TabsTrigger>
      </TabsList>

      <TabsContent value="blocks" className="mt-6">
        <ContextBlocksClient projectId={projectId} basketId={basketId} />
      </TabsContent>

      <TabsContent value="assets" className="mt-6">
        <ContextAssetsClient projectId={projectId} basketId={basketId} />
      </TabsContent>
    </Tabs>
  );
}

// Export separate component for Add Context button to be used in header
export { default as AddContextButton } from "./AddContextButton";
