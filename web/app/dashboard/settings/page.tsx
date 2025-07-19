"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "@/components/settings/ProfileTab";
import PreferencesTab from "@/components/settings/PreferencesTab";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences and profile details
            </p>
          </div>
        </div>

        <Card>
          <p className="text-sm text-muted-foreground">
            Customize your experience and manage your profile information.
          </p>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
  );
}
