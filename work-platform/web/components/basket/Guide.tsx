"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Guide() {
  return (
    <aside className="w-64 border-l p-4">
      <Tabs defaultValue="ask" className="h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ask">Ask</TabsTrigger>
          <TabsTrigger value="suggest">Suggest</TabsTrigger>
        </TabsList>
        <TabsContent value="ask" className="mt-4">
          <p className="text-sm text-muted-foreground">Ask placeholder</p>
        </TabsContent>
        <TabsContent value="suggest" className="mt-4">
          <p className="text-sm text-muted-foreground">Suggest placeholder</p>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
