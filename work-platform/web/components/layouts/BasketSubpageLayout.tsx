"use client";

import React from "react";
import { SubpageHeader } from "@/components/basket/SubpageHeader";

interface BasketSubpageLayoutProps {
  basketId: string;
  title: string;
  description?: string;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
}

export default function BasketSubpageLayout({
  basketId,
  title,
  description,
  rightContent,
  children,
}: BasketSubpageLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4 space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <SubpageHeader title={title} basketId={basketId} description={description} rightContent={rightContent} />
      </div>
      {children}
    </div>
  );
}

