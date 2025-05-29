//web/components/profile-create/types.ts
/**
 * Form data for profile creation. All fields are collected as strings;
 * array-like fields should be comma-separated and parsed on submit.
 */
export type FormData = {
  display_name: string;
  brand_or_company: string;
  sns_handle: string;
  primary_sns_channel: string;
  platforms: string;
  follower_count: string;
  locale: string;
  tone_preferences: string;
  logo_url: string;
};
