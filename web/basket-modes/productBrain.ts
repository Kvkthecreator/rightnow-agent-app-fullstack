import type { BasketModeConfig } from './types';

export const productBrainMode: BasketModeConfig = {
  id: 'product_brain',
  label: 'Product Brain',
  tagline: 'Spin raw insight into a living PRD stack.',
  description:
    'Optimised for solo founders building product direction. Substrate fuels canonical narratives, prompt packs, and API scaffolds that evolve as you capture more signal.',
  deliverables: [
    {
      id: 'prd',
      title: 'Living PRD',
      description: 'Narrative artefact outlining problem, solution, scope, and guardrails sourced from vetted substrate.',
    },
    {
      id: 'prompt_pack',
      title: 'Prompt Pack',
      description: 'Reusable prompt templates aligned to the current product thesis and substrate references.',
    },
    {
      id: 'api_spec',
      title: 'API Skeleton',
      description: 'Structured contract map derived from blocks and relationships for engineering kickoff.',
    },
  ],
  onboarding: {
    headline: 'Capture founder truth, then compose deliverables.',
    steps: [
      {
        id: 'capture_truth',
        title: 'Document the raw narrative',
        description: 'Add founder notes, calls, and market observations so governance can extract blocks.',
        cta: { label: 'Add Memory', href: '#add-memory' },
      },
      {
        id: 'approve_substrate',
        title: 'Approve key building blocks',
        description: 'Review the core problem, user, and solution blocks to lock the initial substrate canon.',
        cta: { label: 'Review Blocks', href: '/building-blocks' },
      },
      {
        id: 'compose_deliverables',
        title: 'Generate product artefacts',
        description: 'Use the documents surface to compose PRD v1 and prompt pack, anchored to approved substrate.',
        cta: { label: 'Compose PRD', href: '/documents' },
      },
    ],
    completion: 'When PRD, prompt pack, and API spec documents exist with recent substrate references, onboarding is complete.',
  },
};
