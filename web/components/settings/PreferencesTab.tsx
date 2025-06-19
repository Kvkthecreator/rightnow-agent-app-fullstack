"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchMockPreferences, saveMockPreferences, Preferences } from "@/lib/mocks/settings";
import toast from "react-hot-toast";

export default function PreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMockPreferences().then(setPrefs);
  }, []);

  if (!prefs) return <div>Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    await saveMockPreferences(prefs);
    setSaving(false);
    toast.success("Saved (mock)");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Theme</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={prefs.theme === "light"}
              onChange={() => setPrefs({ ...prefs, theme: "light" })}
            />
            <span>Light</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={prefs.theme === "dark"}
              onChange={() => setPrefs({ ...prefs, theme: "dark" })}
            />
            <span>Dark</span>
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Default Quick-Dump Basket</label>
        <Select
          value={prefs.dumpBasket ?? ""}
          onValueChange={(v) => setPrefs({ ...prefs, dumpBasket: v || null })}
        >
          <SelectTrigger>
            <SelectValue placeholder="— none —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">— none —</SelectItem>
            {/* TODO(api): replace with real basket options */}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={saving}>Save</Button>
    </div>
  );
}
