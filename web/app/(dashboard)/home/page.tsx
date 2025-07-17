"use client";

import AuthGuard from "@/app/components/AuthGuard";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">👋 Welcome back</h1>
        <p className="text-muted-foreground">
          Use the sidebar to select or create a basket to get started.
        </p>
      </div>
    </AuthGuard>
  );
}
