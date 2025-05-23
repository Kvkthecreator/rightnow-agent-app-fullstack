import dynamic from "next/dynamic";
import type React from "react";

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
  const Lazy = dynamic(
    COMPONENT_MAP[outputType] || (() => import("./Fallback"))
  ) as React.ComponentType<any>;

  return <Lazy data={data} />;
}