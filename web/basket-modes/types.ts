export type BasketModeId = 'default' | 'product_brain' | 'campaign_brain';

export type AnchorScope = 'core' | 'brain';

export type AnchorSpec = {
  id: string;
  label: string;
  scope: AnchorScope;
  substrateType: 'block' | 'context_item' | 'relationship';
  description: string;
  acceptanceCriteria: string;
  required: boolean;
  dependsOn?: string[];
};

export type CaptureRecipe = {
  id: string;
  title: string;
  description: string;
  captureType: 'raw_dump' | 'file_upload' | 'inline_block' | 'inline_context';
  prompt?: string;
  intentMetadata?: Record<string, string>;
  anchorRefs?: string[];
};

export type DeliverableSpec = {
  id: string;
  title: string;
  description: string;
  composeIntent: string;
  requiredAnchors: string[];
  optionalAnchors?: string[];
};

export type ProgressRule = {
  id: string;
  label: string;
  description?: string;
  requiredAnchors?: string[];
  minCounts?: Record<string, number>;
};

type ModeStepCTA = {
  label: string;
  href: string;
};

type ModeStep = {
  id: string;
  title: string;
  description: string;
  cta?: ModeStepCTA;
};

export type BasketModeConfig = {
  id: BasketModeId;
  label: string;
  tagline: string;
  description: string;
  onboarding: {
    headline: string;
    steps: ModeStep[];
    completion: string;
  };
  anchors: {
    core: AnchorSpec[];
    brain: AnchorSpec[];
  };
  captureRecipes: CaptureRecipe[];
  deliverables: DeliverableSpec[];
  progress: {
    checklist: ProgressRule[];
  };
};
