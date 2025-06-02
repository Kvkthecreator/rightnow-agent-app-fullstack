export interface FormData {
  display_name: string;
  brand_or_company: string;
  sns_handle: string;
  primary_sns_channel: string;
  platforms: string;
  follower_count: string;
  locale: string;
  tone_preferences: string;
  logo_url: string;
}

export type Step = 1 | 2 | 3;