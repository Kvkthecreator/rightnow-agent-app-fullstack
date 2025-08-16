import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";
import { ensureWorkspaceServer } from "@/lib/workspaces/ensureWorkspaceServer";
import { z } from "zod";
import type { CreateBasketReq, CreateBasketRes } from "@shared/contracts/baskets";

// Validate request against spec
const CreateBasketSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().optional(),
  idempotency_key: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = createServerSupabaseClient();
    
    // Use getUser() for secure authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required", details: {} } },
        { status: 401 }
      );
    }

    // Parse and validate request body against spec
    const body = await request.json();
    const validationResult = CreateBasketSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid request format", details: validationResult.error.format() } },
        { status: 400 }
      );
    }

    const { workspace_id, name = "Untitled Basket", idempotency_key } = validationResult.data;

    // Verify workspace membership
    const { data: membership } = await supabase
      .from("workspace_memberships")
      .select("workspace_id")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      console.error("Workspace access denied:", { userId: user.id, workspaceId: workspace_id });
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "User not a member of workspace", details: {} } },
        { status: 403 }
      );
    }

    // Check for existing basket with same idempotency key (replay detection)
    const { data: existingBasket } = await supabase
      .from("baskets")
      .select("id")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotency_key)
      .single();

    if (existingBasket) {
      // Log replay event
      console.log(JSON.stringify({
        route: "/api/baskets/new",
        user_id: user.id,
        idempotency_key,
        action: "replayed",
        basket_id: existingBasket.id,
        duration_ms: Date.now() - startTime
      }));
      
      return NextResponse.json(
        { basket_id: existingBasket.id } satisfies CreateBasketRes,
        { status: 200 }
      );
    }

    // Create new basket (side-effect free - no dumps created)
    const { data: basket, error: createError } = await supabase
      .from("baskets")
      .insert({
        name,
        workspace_id,
        user_id: user.id,
        idempotency_key,
        status: "INIT" // Use enum value from spec
      })
      .select("id")
      .single();

    if (createError) {
      // Check for idempotency conflict (race condition)
      if (createError.code === "23505" && createError.message?.includes("uq_baskets_user_idem")) {
        console.error("Idempotency conflict detected:", createError);
        return NextResponse.json(
          { error: { code: "IDEMPOTENCY_CONFLICT", message: "Same idempotency key with different payload", details: {} } },
          { status: 409 }
        );
      }
      
      console.error("Basket creation error:", createError);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create basket", details: { dbError: createError.message } } },
        { status: 500 }
      );
    }

    if (!basket) {
      console.error("Basket creation returned no data");
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to create basket - no data returned", details: {} } },
        { status: 500 }
      );
    }

    // Log creation event
    console.log(JSON.stringify({
      route: "/api/baskets/new",
      user_id: user.id,
      idempotency_key,
      action: "created",
      basket_id: basket.id,
      duration_ms: Date.now() - startTime
    }));

    return NextResponse.json(
      { basket_id: basket.id } satisfies CreateBasketRes,
      { status: 201 }
    );

  } catch (error) {
    console.error("Basket creation API error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error", details: { error: error instanceof Error ? error.message : "Unknown error" } } },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed. Use POST to create a basket.", details: {} } },
    { status: 405 }
  );
}