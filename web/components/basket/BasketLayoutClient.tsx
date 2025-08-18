"use client";

import React from "react";
import TopBar from "@/components/basket/TopBar";
import BasketNav from "@/components/basket/BasketNav";
import Guide from "@/components/basket/Guide";

export default function BasketLayoutClient({
  basketId,
  basketName,
  children,
}: {
  basketId: string;
  basketName: string;
  children: React.ReactNode;
}) {
  const [showNav, setShowNav] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("basket-nav") !== "hidden";
  });

  React.useEffect(() => {
    localStorage.setItem("basket-nav", showNav ? "show" : "hidden");
  }, [showNav]);

  return (
    <div className="flex h-screen flex-col">
      <TopBar title={basketName} onToggleNav={() => setShowNav((s) => !s)} />
      <div className="flex flex-1 overflow-hidden">
        {showNav && <BasketNav basketId={basketId} />}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        <Guide />
      </div>
    </div>
  );
}
