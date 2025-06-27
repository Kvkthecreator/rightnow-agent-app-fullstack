"use client";
import { ReactNode } from "react";

interface Props {
  initialSnapshot: any;
  children?: ReactNode;
}

export default function WorkbenchLayoutDev({ children }: Props) {
  return <div className="min-h-screen bg-yellow-50">{children}</div>;
}
