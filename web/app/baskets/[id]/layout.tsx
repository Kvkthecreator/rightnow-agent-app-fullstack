import TopBar from "@/components/basket/TopBar";
import BasketNav from "@/components/basket/BasketNav";
import Guide from "@/components/basket/Guide";
import React from "react";
import { getServerUrl } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function BasketLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const baseUrl = getServerUrl();
  const res = await fetch(`${baseUrl}/api/baskets/${id}/state`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { name: "Basket" };
  return (
    <BasketLayoutClient basketId={id} basketName={data.name}>
      {children}
    </BasketLayoutClient>
  );
}

function BasketLayoutClient({
  basketId,
  basketName,
  children,
}: {
  basketId: string;
  basketName: string;
  children: React.ReactNode;
}) {
  "use client";
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
