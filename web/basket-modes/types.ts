export type BasketModeId = 'default' | 'product_brain' | 'campaign_brain';

export type AnchorScope = 'core' | 'brain';

export type AnchorSpec = {
  id: string;
  label: string;
  scope: AnchorScope;
  substrateType: 'block' | 'context_item' | 'relationship';
  description: string;
  acceptanceCriteria: string;
  /**
   * Phase A: ADVISORY ONLY (not enforced)
   * `required: true` means "strongly recommended" but does not block composition.
   * Anchors emerge from user-promoted substrate via governance (Phase B).
   * Mode configs provide suggestions, not hard requirements.
   */
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
  /**
   * Phase A: ADVISORY ONLY (not enforced)
   * `requiredAnchors` are "recommended inputs" but composition proceeds
   * with graceful degradation if anchors are missing (shows unknowns).
   * Phase B will implement coverage thresholds (e.g., 70% coverage unlocks compose).
   */
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
