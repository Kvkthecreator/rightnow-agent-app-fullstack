export type BasketSection = {
  key: "memory" | "timeline" | "reflections" | "graph" | "building-blocks" | "documents";
  label: string;
  href: (id: string) => string;
};

// \uD83D\uDD12 Canonical UI order (display only)
export const SECTION_ORDER: BasketSection[] = [
  { key: "memory", label: "Memory", href: (id) => `/baskets/${id}/memory` },
  { key: "timeline", label: "Timeline", href: (id) => `/baskets/${id}/timeline` },
  { key: "reflections", label: "Reflections", href: (id) => `/baskets/${id}/reflections` },
  { key: "graph", label: "Graph", href: (id) => `/baskets/${id}/graph` },
  { key: "building-blocks", label: "Building Blocks", href: (id) => `/baskets/${id}/building-blocks` },
  { key: "documents", label: "Documents", href: (id) => `/baskets/${id}/documents` },
];

// Optional child section handling (displayed only where a child list is already shown)
export const SECTION_CHILDREN: Record<
  string,
  { key: string; label: string; href: (id: string, docId: string) => string }[]
> = {
  documents: [
    {
      key: "docWork",
      label: "Document Work",
      href: (id, docId) => `/baskets/${id}/documents/${docId}/work`,
    },
  ],
};
