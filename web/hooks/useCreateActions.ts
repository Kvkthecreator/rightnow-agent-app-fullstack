"use client";

import { useRouter } from "next/navigation";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/lib/useAuth";
import { createDocumentWithPrompt } from "@/lib/documents/createDocument";
import { postDump } from "@/lib/baskets/dumpApi";
import { useToast } from "@/components/ui/Toast";

/**
 * Encapsulates creation actions for the basket sidebar popover.
 * Provides handlers for quick dumps, blank documents and file uploads.
 */
export function useCreateActions() {
  const router = useRouter();
  const { basket } = useBasket();
  const { user } = useAuth();
  const { showSuccess, showWarning } = useToast();

  const basketId = basket?.id;

  return {
    quickDump: () => {
      if (!basketId) return;
      const el = document.getElementById(
        "thinking-partner-input"
      ) as HTMLTextAreaElement | null;
      if (el) {
        el.focus();
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      console.debug("quickDump invoked", { basketId });
      showSuccess("Quick dump ready");
    },

    newBlankDocument: async () => {
      if (!basketId) return;
      try {
        const doc = await createDocumentWithPrompt(basketId);
        router.push(`/baskets/${basketId}/work/documents/${doc.id}`);
      } catch (e) {
        console.warn("newBlankDocument failed", e);
        showWarning("Couldn't create document");
      }
    },

    uploadFiles: () => {
      const input = document.getElementById(
        "leftnav-upload-hidden"
      ) as HTMLInputElement | null;
      if (input) {
        input.value = "";
        input.click();
      }
    },

    handleSelectedFiles: async (files: FileList) => {
      if (!basketId || !user?.id || !files.length) return;
      try {
        await postDump({
          basketId,
          userId: user.id,
          images: Array.from(files),
        });
        showSuccess(`Captured ${files.length} file(s) as raw dumps`);
      } catch (e) {
        console.warn("uploadFiles failed", e);
        showWarning("Upload failed");
      }
    },
  };
}

