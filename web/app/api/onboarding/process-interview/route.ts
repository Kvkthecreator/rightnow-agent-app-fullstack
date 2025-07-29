import { NextRequest, NextResponse } from "next/server";
import { processInterview } from "@/lib/onboarding/processInterview";
import { InterviewResponse, BusinessContext } from "@/components/onboarding/OnboardingAgent";

export async function POST(request: NextRequest) {
  try {
    const { responses, businessContext } = await request.json();

    // Validate request data
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Invalid responses data" },
        { status: 400 }
      );
    }

    if (!businessContext || typeof businessContext !== 'object') {
      return NextResponse.json(
        { error: "Invalid business context data" },
        { status: 400 }
      );
    }

    // Process the interview using the existing service
    const workspaceCreationPlan = await processInterview(
      responses as InterviewResponse[],
      businessContext as BusinessContext
    );

    // Return the generated workspace plan
    return NextResponse.json({
      success: true,
      plan: workspaceCreationPlan,
      message: "Interview processed successfully"
    });

  } catch (error) {
    console.error("Interview processing error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process interview",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}