"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, right, children, className }: SectionCardProps) {
  return (
    <Card className={className}>
      {(title || subtitle || right) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {right ? <div className="self-center">{right}</div> : null}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

