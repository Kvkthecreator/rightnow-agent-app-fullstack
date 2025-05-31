"use client";

import React from "react";

interface Props {
  params: { outputId: string };
}

export default function OutputDetailPage({ params }: Props) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Output ID: {params.outputId}</h1>
      <p className="text-muted-foreground text-sm">
        This is where the output result will be displayed.
      </p>
    </div>
  );
}
