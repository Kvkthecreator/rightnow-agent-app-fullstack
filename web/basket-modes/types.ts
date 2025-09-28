export type BasketModeId = 'default' | 'product_brain' | 'campaign_brain';

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

type ModeDeliverable = {
  id: string;
  title: string;
  description: string;
};

export type BasketModeConfig = {
  id: BasketModeId;
  label: string;
  tagline: string;
  description: string;
  deliverables: ModeDeliverable[];
  onboarding: {
    headline: string;
    steps: ModeStep[];
    completion: string;
  };
};
