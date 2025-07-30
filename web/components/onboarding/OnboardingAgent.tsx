"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import InterviewFlow from "./InterviewFlow";
import WorkspaceConfirmation from "./WorkspaceConfirmation";
import { useRouter } from "next/navigation";

export interface InterviewResponse {
  questionId: string;
  question: string;
  response: string;
  timestamp: number;
}

export interface BusinessContext {
  challenge: string;
  businessType: string;
  stakeholders: string;
  existingInfo: string;
  successCriteria: string;
}

export interface WorkspaceCreationPlan {
  basketName: string;
  basketDescription: string;
  documents: {
    title: string;
    type: string;
    initialContent: string;
    suggestedBlocks: string[];
  }[];
  contextItems: {
    type: string;
    content: string;
    relevance: number;
  }[];
  intelligenceSeeds: {
    themes: string[];
    patterns: string[];
    connections: string[];
  };
}

type OnboardingStage = 'interview' | 'confirmation' | 'creating' | 'complete';

export default function OnboardingAgent() {
  const [stage, setStage] = useState<OnboardingStage>('interview');
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [workspacePlan, setWorkspacePlan] = useState<WorkspaceCreationPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleInterviewComplete = async (
    interviewResponses: InterviewResponse[],
    context: BusinessContext
  ) => {
    setResponses(interviewResponses);
    setBusinessContext(context);
    setIsProcessing(true);

    try {
      // Process interview responses into workspace plan
      const { processInterview } = await import('@/lib/onboarding/processInterview');
      const plan = await processInterview(interviewResponses, context);
      
      setWorkspacePlan(plan);
      setStage('confirmation');
    } catch (error) {
      console.error('Failed to process interview:', error);
      // Handle error - could show error state or retry option
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWorkspaceCreation = async () => {
    if (!workspacePlan || !businessContext) return;

    setStage('creating');

    try {
      // Create the actual workspace
      const { createWorkspace } = await import('@/lib/onboarding/createWorkspace');
      const result = await createWorkspace(workspacePlan, businessContext);
      
      setStage('complete');
      
      // Give user a moment to see completion, then redirect to workspace
      setTimeout(() => {
        router.push(`/baskets/${result.basketId}/work`);
      }, 2000);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      // Handle error - could show error state or retry option
      setStage('confirmation');
    }
  };

  const handleRestart = () => {
    setStage('interview');
    setResponses([]);
    setBusinessContext(null);
    setWorkspacePlan(null);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${stage === 'interview' ? 'text-primary' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              stage === 'interview' ? 'border-primary bg-primary text-white' : 'border-green-600 bg-green-600 text-white'
            }`}>
              {stage === 'interview' ? '1' : '✓'}
            </div>
            <span className="ml-2 text-sm font-medium">Interview</span>
          </div>
          
          <div className={`w-12 h-0.5 ${stage === 'interview' ? 'bg-gray-300' : 'bg-green-600'}`} />
          
          <div className={`flex items-center ${
            stage === 'confirmation' ? 'text-primary' : 
            stage === 'creating' || stage === 'complete' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              stage === 'confirmation' ? 'border-primary bg-primary text-white' :
              stage === 'creating' || stage === 'complete' ? 'border-green-600 bg-green-600 text-white' :
              'border-gray-300 bg-white text-gray-400'
            }`}>
              {stage === 'creating' || stage === 'complete' ? '✓' : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Create</span>
          </div>
          
          <div className={`w-12 h-0.5 ${stage === 'creating' || stage === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${stage === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
              stage === 'complete' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {stage === 'complete' ? '✓' : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">Launch</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-8 bg-white shadow-lg">
        {stage === 'interview' && (
          <InterviewFlow
            onComplete={handleInterviewComplete}
            isProcessing={isProcessing}
          />
        )}

        {stage === 'confirmation' && workspacePlan && (
          <WorkspaceConfirmation
            plan={workspacePlan}
            businessContext={businessContext!}
            onConfirm={handleWorkspaceCreation}
            onRestart={handleRestart}
          />
        )}

        {stage === 'creating' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">Creating Your Intelligent Workspace</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              I'm setting up your workspace with documents, analysis, and AI insights. 
              This will just take a moment...
            </p>
          </div>
        )}

        {stage === 'complete' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold mb-4 text-green-600">Workspace Created Successfully!</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Your intelligent workspace is ready with AI-powered insights, contextual analysis, 
              and smart suggestions. Redirecting you to your new workspace...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Taking you to your workspace...</span>
            </div>
          </div>
        )}
      </Card>

      {/* Bottom Help Text */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        Need help? This process takes about 3-5 minutes and creates a complete workspace 
        with AI-powered insights ready to use immediately.
      </div>
    </div>
  );
}