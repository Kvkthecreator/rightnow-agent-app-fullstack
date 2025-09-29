import type { AnchorSpec } from './types';

export const CORE_ANCHORS: AnchorSpec[] = [
  {
    id: 'core_problem',
    label: 'Problem Statement',
    scope: 'core',
    substrateType: 'block',
    description: 'What fundamental user or business problem are we solving?',
    acceptanceCriteria: 'Statement references user segment and pain. Links to supporting evidence where possible.',
    required: true,
  },
  {
    id: 'core_customer',
    label: 'Primary Customer',
    scope: 'core',
    substrateType: 'block',
    description: 'Who experiences the problem? Capture persona, environment, and motivation.',
    acceptanceCriteria: 'Block captures persona characteristics and explicit needs. References problem block.',
    required: true,
    dependsOn: ['core_problem'],
  },
  {
    id: 'product_vision',
    label: 'Vision & Differentiation',
    scope: 'core',
    substrateType: 'block',
    description: 'Why this approach, why now. Defines the high-level arc.',
    acceptanceCriteria: 'Includes strategic intent, differentiators, and horizon. References problem & customer anchors.',
    required: true,
    dependsOn: ['core_problem', 'core_customer'],
  },
  {
    id: 'success_metrics',
    label: 'Success Metrics',
    scope: 'core',
    substrateType: 'context_item',
    description: 'Quantitative or qualitative indicators of success.',
    acceptanceCriteria: 'Defines metric(s), measurement cadence, and owner.',
    required: true,
  },
];
