## codex/tasks/1_task-M5-d-patch-b-fix_renderer_switch_typing.md

# Fix TS prop-type error in RendererSwitch

## Context
`next/dynamic` infers an empty props object.  We cast the result to
`React.ComponentType<any>` so the `data` prop is accepted.

## Changes
```diff
* web/components/renderers/RendererSwitch.tsx

*** 🔧 Patch ***
@@
-const COMPONENT_MAP: Record<string, () => Promise<any>> = {
+import type React from "react";
+
+const COMPONENT_MAP: Record<string, () => Promise<any>> = {
   CompetitorTable: () =>
     import("./CompetitorTable").then((m) => ({ default: m.CompetitorTable })),
 };
 
 export function RendererSwitch({ outputType, data }: RendererSwitchProps) {
-  const LazyComponent = dynamic(
-    COMPONENT_MAP[outputType] || (() => import("./Fallback"))
-  );
-
-  return <LazyComponent data={data} />;
+  const Lazy = dynamic(
+    COMPONENT_MAP[outputType] || (() => import("./Fallback"))
+  ) as React.ComponentType<any>;
+
+  return <Lazy data={data} />;
 }