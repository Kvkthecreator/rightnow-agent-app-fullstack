import { NextRequest, NextResponse } from "next/server";
import { createWorkspace } from "@/lib/onboarding/createWorkspace";
import { WorkspaceCreationPlan, BusinessContext } from "@/components/onboarding/OnboardingAgent";

export async function POST(request: NextRequest) {
  try {
    const { plan, businessContext } = await request.json();

    // Validate request data
    if (!plan || typeof plan !== 'object') {
      return NextResponse.json(
        { error: "Invalid workspace creation plan" },
        { status: 400 }
      );
    }

    if (!businessContext || typeof businessContext !== 'object') {
      return NextResponse.json(
        { error: "Invalid business context data" },
        { status: 400 }
      );
    }

    // Validate required plan fields
    const requiredFields = ['basketName', 'basketDescription', 'documents', 'contextItems', 'intelligenceSeeds'];
    for (const field of requiredFields) {
      if (!plan[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the workspace using the existing service
    const workspaceResult = await createWorkspace(
      plan as WorkspaceCreationPlan,
      businessContext as BusinessContext
    );

    // Return the created workspace details
    return NextResponse.json({
      success: true,
      workspace: workspaceResult,
      message: "Workspace created successfully",
      redirectUrl: `/workspace/${workspaceResult.basketId}`
    });

  } catch (error) {
    console.error("Workspace creation error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to create workspace",
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