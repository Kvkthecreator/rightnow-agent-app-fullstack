"use client";

import { useAuth } from "@/lib/useAuth";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import OnboardingContent from "./OnboardingContent";

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            <OnboardingContent router={router} />
          </Suspense>

          {/* Features Preview */}
          <div className="mt-16 pt-12 border-t">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold mb-2">What makes this intelligent?</h3>
              <p className="text-muted-foreground">
                Our universal intelligence engine understands your content and builds accordingly
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-card border">
                <div className="text-3xl mb-3">🧠</div>
                <h4 className="font-medium mb-2">Real-time Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes your content as you add it, identifying themes and patterns instantly
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-card border">
                <div className="text-3xl mb-3">📚</div>
                <h4 className="font-medium mb-2">Smart Organization</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically creates relevant documents and structures based on your content
                </p>
              </div>
              
              <div className="text-3xl mb-3 text-center p-6 rounded-lg bg-card border">
                <div className="text-3xl mb-3">🔗</div>
                <h4 className="font-medium mb-2">Contextual Connections</h4>
                <p className="text-sm text-muted-foreground">
                  Links related ideas and suggests next steps for your basket
                </p>
              </div>
            </div>
          </div>

          {/* Supported Content Types */}
          <div className="mt-12 text-center">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
              SUPPORTED CONTENT TYPES
            </h4>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { icon: '📄', label: 'Text Files' },
                { icon: '📝', label: 'Notes & Ideas' },
                { icon: '🔗', label: 'Web Content' },
                { icon: '📊', label: 'Documents' },
                { icon: '💭', label: 'Requirements' },
                { icon: '🎯', label: 'Goals & Vision' }
              ].map(type => (
                <div key={type.label} className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                  <span>{type.icon}</span>
                  <span className="text-xs font-medium">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}