import type { BasketModeConfig } from './types';
import { CORE_ANCHORS } from './coreAnchors';

export const defaultMode: BasketModeConfig = {
  id: 'default',
  label: 'Knowledge Garden',
  tagline: 'Grow structured understanding from every capture.',
  description:
    'The baseline Yarnnn experience. Capture raw input, let governance harden substrate, and explore the graph to discover emergent structure.',
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
    completion: 'Once you have approved core anchors and at least one canonical document, you are operating at canon baseline.',
  },
  anchors: {
    core: CORE_ANCHORS,
    brain: [],
  },
  captureRecipes: [
    {
      id: 'problem-dump',
      title: 'Problem Narrative',
      description: 'Paste a story or transcript that captures the core problem in your own words.',
      captureType: 'raw_dump',
      prompt: 'Describe the pain you observe, who feels it, and what breaks if it remains unsolved. Include quotes or artifacts.',
      anchorRefs: ['core_problem', 'core_customer'],
    },
    {
      id: 'vision-note',
      title: 'Vision Outline',
      description: 'Summarise the north star and why you believe this approach wins.',
      captureType: 'inline_block',
      prompt: 'Capture the strategic thesis, differentiators, and horizon (6-12 months).',
      anchorRefs: ['product_vision'],
    },
    {
      id: 'metrics-entry',
      title: 'Define Success Metrics',
      description: 'List the leading and lagging indicators you will track.',
      captureType: 'inline_context',
      prompt: 'For each metric, include target value, measurement cadence, and owner.',
      anchorRefs: ['success_metrics'],
    },
  ],
  deliverables: [
    {
      id: 'canon_docs',
      title: 'Canonical Documents',
      description: 'Living documents that stay in sync with your substrate.',
      composeIntent: 'canon_document',
      requiredAnchors: ['core_problem', 'core_customer', 'product_vision'],
    },
    {
      id: 'reflections',
      title: 'Guided Reflections',
      description: 'Periodic insights that surface tensions, blind spots, and next moves.',
      composeIntent: 'reflection_digest',
      requiredAnchors: ['core_problem', 'success_metrics'],
    },
  ],
  progress: {
    checklist: [
      {
        id: 'core-truths',
        label: 'Core truths captured',
        description: 'Problem, customer, vision, and success metrics anchors exist.',
        requiredAnchors: ['core_problem', 'core_customer', 'product_vision', 'success_metrics'],
      },
      {
        id: 'first-doc',
        label: 'First canonical document composed',
        description: 'At least one canon document exists referencing the core anchors.',
      },
    ],
  },
};
