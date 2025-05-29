"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InputInline } from "@/components/InputInline";
import { TextareaInline } from "@/components/TextareaInline";

interface Section {
  id: string;
  title: string;
  body: string;
}

interface ProfileCoreData {
  id: string;
  display_name?: string;
  brand_or_company?: string;
  sns_links?: Record<string, string>;
  tone_preferences?: string;
  logo_url?: string;
  locale?: string;
}

export default function ProfilePage() {
  const supabase = useSupabaseClient();
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileCoreData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!session?.user) {
      router.replace("/auth/login");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profile_core_data")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (error || !data) {
        router.replace("/profile-create");
        return;
      }
      setProfile(data);
      const { data: secs, error: secErr } = await supabase
        .from("profile_report_sections")
        .select("*")
        .eq("profile_id", data.id)
        .order("order_index", { ascending: true });
      if (!secErr && secs) setSections(secs as Section[]);
    })();
  }, [session, isLoading]);

  if (isLoading || !session) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Your Profile</h1>
        <Button variant="outline" onClick={() => router.push("/profile/create")}>
          Edit Profile
        </Button>
      </div>
      <Card className="space-y-4">
        <InputInline label="Display Name" value={profile?.display_name || ""} readOnly />
        <InputInline label="Brand/Company" value={profile?.brand_or_company || ""} readOnly />
        <InputInline label="SNS Links" value={JSON.stringify(profile?.sns_links || {})} readOnly />
        <InputInline label="Tone Preferences" value={profile?.tone_preferences || ""} readOnly />
        <InputInline label="Locale" value={profile?.locale || ""} readOnly />
        {profile?.logo_url && (
          <img src={profile.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded" />
        )}
      </Card>
      <Card>
        <h2 className="font-medium mb-2">Sections</h2>
        {sections.map((sec) => (
          <div key={sec.id} className="p-2 border-b">
            <div className="font-medium">{sec.title}</div>
            <TextareaInline value={sec.body} readOnly />
          </div>
        ))}
      </Card>
    </div>
  );
}