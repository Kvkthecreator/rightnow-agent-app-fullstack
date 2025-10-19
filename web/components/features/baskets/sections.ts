export type BasketSection = {
  key: "memory" | "uploads" | "timeline" | "insights" | "graph" | "building-blocks" | "documents" | "change-requests";
  label: string;
  href: (id: string) => string;
};

// 🔒 User-intent grouping (Canon v5.0)
export const SECTION_ORDER: BasketSection[] = [
  // Overview
  { key: "memory", label: "Overview", href: (id) => `/baskets/${id}/overview` },
  { key: "uploads", label: "Uploads", href: (id) => `/baskets/${id}/uploads` },
  { key: "building-blocks", label: "Building Blocks", href: (id) => `/baskets/${id}/building-blocks` },
  { key: "change-requests", label: "Change Requests", href: (id) => `/baskets/${id}/change-requests` },

  // Insights
  { key: "insights", label: "Insights", href: (id) => `/baskets/${id}/insights` },
  { key: "graph", label: "Network", href: (id) => `/baskets/${id}/graph` },
  { key: "timeline", label: "Timeline", href: (id) => `/baskets/${id}/timeline` },

  // Documents
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
