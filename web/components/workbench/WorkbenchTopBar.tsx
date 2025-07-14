"use client";
import { Badge } from "@/components/ui/Badge";
import { ReactNode } from "react";

interface Props {
  basketName: string;
  status: string;
  actions?: ReactNode;
}

export default function WorkbenchTopBar({ basketName, status, actions }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/70 px-4 py-2 backdrop-blur">
      <h1 className="flex-1 truncate text-sm font-medium">{basketName}</h1>
      <Badge variant="secondary">{status}</Badge>
      {actions}
    </header>
  );
}
