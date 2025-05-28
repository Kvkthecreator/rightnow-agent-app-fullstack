/**
 * Form data for profile creation. All fields are collected as strings;
 * array-like fields should be comma-separated and parsed on submit.
 */
export interface FormData {
  display_name: string;
  sns_handle: string;
  primary_sns_channel: string;
  platforms: string; // comma-separated
  follower_count: string;
  niche: string;
  audience_goal: string;
  monetization_goal: string;
  primary_objective: string;
  content_frequency: string;
  tone_keywords: string; // comma-separated
  favorite_brands: string; // comma-separated
  prior_attempts: string;
  creative_barriers: string;
  locale: string;
  /** URL of uploaded logo */
  logo_url?: string;
}