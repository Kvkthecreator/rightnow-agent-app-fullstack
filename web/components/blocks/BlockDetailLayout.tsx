"use client";
import { ReactNode } from "react";
import RightPanelLayout from "@/components/blocks/RightPanelLayout";

interface Props {
  children: ReactNode;
  sidePanel?: ReactNode;
}

export default function BlockDetailLayout({ children, sidePanel }: Props) {
  return (
    <RightPanelLayout rightPanel={sidePanel} className="max-w-4xl mx-auto p-6">
      {children}
    </RightPanelLayout>
  );
}
