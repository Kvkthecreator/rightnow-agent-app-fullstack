"use client";
import { ReactNode } from "react";
import WorkbenchLayout from "./WorkbenchLayout";

interface Props {
  initialSnapshot: any;
  rightPanel?: ReactNode;
  children?: ReactNode;
}

export default function WorkbenchLayoutDev({ initialSnapshot, rightPanel, children }: Props) {
  return (
    <WorkbenchLayout snapshot={initialSnapshot} rightPanel={rightPanel}>
      {children}
    </WorkbenchLayout>
  );
}
