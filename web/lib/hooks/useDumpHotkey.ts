"use client";
import { useEffect } from "react";
import { useBasket } from "@/lib/context/BasketContext";
import { openDumpModal } from "@/components/DumpModal";
import { toast } from "react-hot-toast";

export default function useDumpHotkey() {
  const { currentBasketId } = useBasket();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCombo = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "v";
      const target = e.target as HTMLElement;
      if (!isCombo) return;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      if (!currentBasketId) {
        toast.info("Open a basket first to dump");
      } else {
        openDumpModal({ basketId: currentBasketId });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentBasketId]);
}
