import type { BasketModeConfig } from './types';

export const campaignBrainMode: BasketModeConfig = {
  id: 'campaign_brain',
  label: 'Campaign Brain',
  tagline: 'Transform research into multi-channel storytelling.',
  description:
    'Designed for marketing teams that need cohesive campaigns. Substrate captures audience intelligence and messaging pillars, while documents and reflections keep content aligned.',
  deliverables: [
    {
      id: 'campaign_brief',
      title: 'Campaign Brief',
      description: 'Narrative brief tying audience insights, positioning, and offers together.',
    },
    {
      id: 'channel_matrix',
      title: 'Channel Matrix',
      description: 'Mode-aware plan mapping hooks and assets across priority channels.',
    },
    {
      id: 'prompt_library',
      title: 'Prompt Library',
      description: 'Context-rich prompts for creative execution anchored to approved substrate.',
    },
  ],
  onboarding: {
    headline: 'Collect signal, align messaging, launch coherently.',
    steps: [
      {
        id: 'capture_inputs',
        title: 'Capture audience research',
        description: 'Upload call notes, surveys, and briefs so Yarnnn can extract positioning blocks.',
        cta: { label: 'Add Research', href: '#add-memory' },
      },
      {
        id: 'shape_story',
        title: 'Approve messaging substrate',
        description: 'Review blocks for audience tensions, offers, and voice to maintain canon purity.',
        cta: { label: 'Review Blocks', href: '/building-blocks' },
      },
      {
        id: 'ship_campaign',
        title: 'Compose campaign artefacts',
        description: 'Generate the campaign brief and channel matrix, then trigger reflections for optimisation cues.',
        cta: { label: 'Open Documents', href: '/documents' },
      },
    ],
    completion: 'You are campaign-ready when the brief and channel matrix exist and latest reflections show actionable launch guidance.',
  },
};
