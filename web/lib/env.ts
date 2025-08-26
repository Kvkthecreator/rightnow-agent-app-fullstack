export const ONBOARDING_ENABLED = process.env.ONBOARDING_ENABLED !== 'false';
export const ONBOARDING_MODE = (process.env.ONBOARDING_MODE ?? 'auto') as 'auto' | 'welcome' | 'inline';
