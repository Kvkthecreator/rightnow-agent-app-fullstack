export default {
  title: "Refactor work layouts & scaffold dashboard",
  big_picture: `Improves naming clarity for document vs basket work pages and introduces a basic basket dashboard layout.`,
  steps: [
    "Rename WorkbenchLayout to DocumentWorkbenchLayout and update imports.",
    "Create BasketDashboardLayout used by /baskets/[id]/work.",
    "Add .doc.ts files explaining each layout's purpose.",
    "Update pages to use the new components and compile cleanly."
  ]
};
