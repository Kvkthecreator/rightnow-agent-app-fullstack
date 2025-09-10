"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchMockPreferences,
  saveMockPreferences,
} from "@/lib/mocks/settings";
import type { Preferences } from "@/lib/mocks/settings";
import { notificationService } from '@/lib/notifications/service';

export default function PreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMockPreferences();
        setPrefs(data);
      } catch (err) {
        console.error("Failed to load preferences", err);
        setError("Failed to load preferences");
      }
    }
    load();
  }, []);

  if (error) return <div>{error}</div>;
  if (!prefs) return <div>Loading...</div>;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMockPreferences(prefs);
      notificationService.notify({
        type: 'governance.settings.changed',
        title: 'Preferences Saved',
        message: 'Your preferences have been updated (mock)',
        severity: 'success'
      });
    } catch (err) {
      console.error("Failed to save preferences", err);
      notificationService.notify({
        type: 'governance.settings.changed',
        title: 'Save Failed',
        message: 'Failed to save preferences',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
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
