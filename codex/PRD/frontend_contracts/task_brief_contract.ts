   export interface TaskBrief {
     id: string;
     user_id: string;
     intent: string;
     sub_instructions?: string;
     media?: Array<{
       image_url: string;
       description: string;
     }>;
     core_profile_data?: ProfileCoreData;
     created_at: string;
   }

   export interface ProfileCoreData {
     display_name?: string;
     brand_or_company?: string;
     sns_links?: Record<string, string>; // e.g. { instagram: "", youtube: "" }
     tone_preferences?: string;
     logo_url?: string;
     locale?: string;
   }