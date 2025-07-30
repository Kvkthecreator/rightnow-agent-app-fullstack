"use client";

import { useAuth } from "@/lib/useAuth";
import { redirect } from "next/navigation";
import OnboardingAgent from "@/components/onboarding/OnboardingAgent";

export default function NewWorkspacePage() {
  const { user, isLoading } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Create Your Intelligent Workspace
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              I'll help you set up a workspace tailored to your business needs. 
              Just answer a few questions, and I'll create a complete project environment 
              with AI-powered insights from day one.
            </p>
          </div>

          {/* Onboarding Agent Interface */}
          <OnboardingAgent />
        </div>
      </div>
    </div>
  );
}