export type BasketSection = {
  key: "memory" | "uploads" | "timeline" | "reflections" | "graph" | "building-blocks" | "documents" | "governance" | "settings";
  label: string;
  href: (id: string) => string;
};

// 🔒 User-intent grouping (Canon v2.3)
export const SECTION_ORDER: BasketSection[] = [
  // Memory
  { key: "memory", label: "Memory", href: (id) => `/baskets/${id}/memory` },
  { key: "uploads", label: "Uploads", href: (id) => `/baskets/${id}/uploads` },
  { key: "building-blocks", label: "Building Blocks", href: (id) => `/baskets/${id}/building-blocks` },
  { key: "governance", label: "Change Requests", href: (id) => `/baskets/${id}/governance` },
  
  // Insights
  { key: "reflections", label: "Reflections", href: (id) => `/baskets/${id}/reflections` },
  { key: "graph", label: "Graph", href: (id) => `/baskets/${id}/graph` },
  { key: "timeline", label: "Timeline", href: (id) => `/baskets/${id}/timeline` },
  
  // Settings
  { key: "settings", label: "Settings", href: (id) => `/baskets/${id}/settings` },
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
