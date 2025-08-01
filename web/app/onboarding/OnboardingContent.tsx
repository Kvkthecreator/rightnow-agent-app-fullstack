"use client";

import { useSearchParams } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import UniversalProjectCreator from "@/components/onboarding/UniversalWorkspaceCreator";

interface OnboardingContentProps {
  router: AppRouterInstance;
}

export default function OnboardingContent({ router }: OnboardingContentProps) {
  const searchParams = useSearchParams();
  
  const basketId = searchParams.get('basketId');
  const mode = searchParams.get('mode');

  return (
    <>
      {/* Page Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <span>✨</span>
          <span>Universal Intelligence Engine</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          {basketId ? 'Enhance Your Project' : 'Create Your Intelligent Project'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {basketId 
            ? 'Add more content to build stronger intelligence for your existing project'
            : 'Add any content—files, text, ideas—and watch our AI build a complete project with documents, insights, and intelligent organization.'
          }
        </p>
      </div>

      {/* Universal Project Creator */}
      <UniversalProjectCreator 
        existingBasketId={basketId}
        mode={mode}
        onProjectCreated={(finalBasketId) => {
          // Analytics or tracking could go here
          router.push(`/baskets/${finalBasketId}/work`);
        }}
      />
    </>
  );
}