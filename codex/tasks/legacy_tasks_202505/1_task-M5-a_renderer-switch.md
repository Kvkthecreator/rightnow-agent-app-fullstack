## codex/tasks/1_task-M5-a_renderer-switch.md

# M-5 (a) — Add RendererSwitch and hook useTaskTypes

## Context
Frontend needs a single switch component that picks a renderer based on
`output_type`, plus a SWR hook to fetch `/task-types`.

## Changes
```diff
+ web/src/hooks/useTaskTypes.ts
+ web/src/components/renderers/RendererSwitch.tsx

*** ✨ hooks/useTaskTypes.ts ***
import useSWR from "swr";

export interface TaskType {
  id: string;
  title: string;
  description: string;
  output_type: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export const useTaskTypes = () => {
  const { data, error } = useSWR<TaskType[]>("/api/task-types", fetcher);
  return {
    taskTypes: data,
    isLoading: !error && !data,
    isError: error,
  };
};

*** ✨ components/renderers/RendererSwitch.tsx ***
import dynamic from "next/dynamic";

interface RendererSwitchProps {
  outputType: string;
  data: any;
}

// Dynamic import map — add new renderers below
const COMPONENT_MAP: Record<string, () => Promise<any>> = {
  CompetitorTable: () =>
    import("./CompetitorTable").then(m => ({ default: m.CompetitorTable })),
};

export function RendererSwitch({ outputType, data }: RendererSwitchProps) {
  const Lazy = dynamic(COMPONENT_MAP[outputType] || (() => import("./Fallback")));

  return <Lazy data={data} />;
}

---
