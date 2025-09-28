import type { BasketModeConfig } from './types';

export const defaultMode: BasketModeConfig = {
  id: 'default',
  label: 'Knowledge Garden',
  tagline: 'Grow structured understanding from every capture.',
  description:
    'Use Yarnnn as a unified brain. Capture raw input, let governance shape substrate, and explore the graph to discover emergent structure.',
  deliverables: [
    {
      id: 'canon_docs',
      title: 'Canonical Documents',
      description: 'Living documents that stay in sync with your latest substrate mutations.',
    },
    {
      id: 'reflections',
      title: 'Guided Reflections',
      description: 'Periodic insights that surface tensions, blind spots, and next moves based on captured context.',
    },
    {
      id: 'graph',
      title: 'Relationship Graph',
      description: 'Visual map of blocks, context items, and relationships as governance accepts new knowledge.',
    },
  ],
  onboarding: {
    headline: 'Capture → Govern → Explore',
    steps: [
      {
        id: 'capture',
        title: 'Capture a focused memory',
        description: 'Drop a raw dump or quick note so governance has substrate to process.',
        cta: { label: 'Add Memory', href: '#add-memory' },
      },
      {
        id: 'govern',
        title: 'Review substrate mutations',
        description: 'Approve proposals or rely on auto-approval to keep pace with ingest volume.',
        cta: { label: 'Open Governance', href: '/governance' },
      },
      {
        id: 'explore',
        title: 'Trace outcomes',
        description: 'Inspect documents, reflections, and graph relationships to understand how knowledge evolves.',
        cta: { label: 'View Graph', href: '/graph' },
      },
    ],
    completion: 'Once you have approved substrate and at least one canonical document, you are operating at canon baseline.',
  },
};
