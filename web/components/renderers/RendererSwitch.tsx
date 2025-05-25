import dynamic from "next/dynamic";
import type React from "react";
import { Card } from "@/components/ui/Card";
import ErrorBoundary from '../ErrorBoundary'; // Adjust path
import Fallback from './Fallback'; // Import Fallback directly

interface RendererSwitchProps {
  outputType: string;
  data: any;
}

// Dynamic import map — add new renderers below
const COMPONENT_MAP: Record<string, () => Promise<any>> = {
  CompetitorTable: () =>
    import("./CompetitorTable").then((m) => m.CompetitorTable), // Assuming CompetitorTable is default export or named export
  WeeklyPlanTable: () =>
    import("./WeeklyPlanTable").then((m) => m.WeeklyPlanTable), // Assuming WeeklyPlanTable is default export or named export
  MeetingSummary: () =>
    import("./MeetingSummary").then((m) => m.MeetingSummary), // Assuming MeetingSummary is default export or named export
  SocialPostList: () =>
    import("./SocialPostList").then((m) => m.SocialPostList), // Assuming SocialPostList is default export or named export
  SentimentResult: () =>
    import("./SentimentResult").then((m) => m.SentimentResult), // Assuming SentimentResult is default export or named export
  KeywordList: () =>
    import("./KeywordList").then((m) => m.KeywordList), // Assuming KeywordList is default export or named export
};

export function RendererSwitch({ outputType, data }: RendererSwitchProps) {
  // Handle direct error data first
  if (typeof data === "string" || (data && (data as any).error)) {
    return (
      <Card className="p-6 text-red-600 whitespace-pre-wrap">
        {typeof data === "string" ? data : (data as any).error}
      </Card>
    );
  }

  let ComponentToRender: React.ComponentType<any>;

  if (COMPONENT_MAP[outputType]) {
    ComponentToRender = dynamic(COMPONENT_MAP[outputType] as () => Promise<any>);
  } else {
    ComponentToRender = Fallback; // Use Fallback directly if type not in map
  }

  return (
    <ErrorBoundary data={data}>
      <ComponentToRender data={data} />
    </ErrorBoundary>
  );
}