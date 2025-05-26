//web/components/renderers/RendererSwitch.tsx

import dynamic from "next/dynamic";
import type React from "react";
import { Card } from "@/components/ui/Card";

interface RendererSwitchProps {
  outputType: string;
  data: any;
}

// Dynamic import map — add new renderers below
const COMPONENT_MAP: Record<string, () => Promise<any>> = {
  CompetitorTable: () =>
    import("./CompetitorTable").then((m) => ({ default: m.CompetitorTable })),
  WeeklyPlanTable: () =>
    import("./WeeklyPlanTable").then((m) => ({ default: m.WeeklyPlanTable })),
  MeetingSummary: () =>
    import("./MeetingSummary").then((m) => ({ default: m.MeetingSummary })),
  SocialPostList: () =>
    import("./SocialPostList").then((m) => ({ default: m.SocialPostList })),
  SentimentResult: () =>
    import("./SentimentResult").then((m) => ({ default: m.SentimentResult })),
  KeywordList: () =>
    import("./KeywordList").then((m) => ({ default: m.KeywordList })),
};

export function RendererSwitch({ outputType, data }: RendererSwitchProps) {
  // Log invocation
  console.log("🧪 RendererSwitch invoked", {
    outputType,
    dataType: typeof data,
    data,
  });

  // Handle error strings or error objects
  if (typeof data === "string" || (data && (data as any).error)) {
    return (
      <Card className="p-6 text-red-600 whitespace-pre-wrap">
        {typeof data === "string" ? data : (data as any).error}
      </Card>
    );
  }

  // Guard against empty or invalid objects
  if (
    typeof data !== "object" ||
    !data ||
    (Array.isArray(data.competitors) && data.competitors.length === 0)
  ) {
    console.warn("⚠️ Empty or invalid data passed to RendererSwitch", {
      outputType,
      data,
    });

    return (
      <Card className="p-6 text-yellow-600">
        No valid data to render for type: <strong>{outputType}</strong>
      </Card>
    );
  }

  // Warn if output type is unknown
  if (!COMPONENT_MAP[outputType]) {
    console.warn("⚠️ Unknown outputType – falling back to generic", outputType);
  }

  const Lazy = dynamic(
    COMPONENT_MAP[outputType] || (() => import("./Fallback"))
  ) as React.ComponentType<any>;

  return <Lazy data={data} />;
}
