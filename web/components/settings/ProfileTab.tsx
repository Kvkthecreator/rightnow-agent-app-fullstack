"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { fetchMockProfile, saveMockProfile, Profile } from "@/lib/mocks/settings";
import moment from "moment-timezone";
import toast from "react-hot-toast";

export default function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    fetchMockProfile().then(setProfile);
  }, []);

  const [saving, setSaving] = useState(false);

  if (!profile) return <div>Loading...</div>;

  const locales = ["en-US", "fr-FR", "es-ES"];
  const timezones = moment.tz.names();

  const handleSave = async () => {
    setSaving(true);
    await saveMockProfile(profile);
    setSaving(false);
    toast.success("Saved (mock)");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {/* TODO(api): replace with real avatar uploader */}
        <img src={profile.avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              setProfile({ ...profile, avatarUrl: url });
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Display Name</label>
        <Input
          value={profile.displayName}
          onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Locale</label>
        <Select
          value={profile.locale}
          onValueChange={(value) => setProfile({ ...profile, locale: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select locale" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {locales.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Timezone</label>
        <Select
          value={profile.timezone}
          onValueChange={(value) => setProfile({ ...profile, timezone: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent className="max-h-48 overflow-y-auto">
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        Save
      </Button>
    </div>
  );
}
