import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

const Source = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string().min(1) }),
  z.object({ type: z.literal("url"), url: z.string().url() }),
  z.object({
    type: z.literal("file"),
    storage_path: z.string().min(1),
    mime: z.string().optional(),
    size: z.number().optional(),
    title: z.string().optional(),
  }),
]);

const BodySchema = z.object({
  basket_id: z.string().uuid().nullable().optional(),
  intent: z.string().optional(),
  sources: z.array(Source).min(1),
});

export async function POST(req: Request) {
  const reqId = req.headers.get("X-Req-Id") || `ui-${Date.now()}`;
  try {
    const body = BodySchema.parse(await req.json());

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error("dumps/new unauthorized", { reqId });
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId =
      (session.user?.app_metadata as any)?.workspace_id ||
      (session.user?.user_metadata as any)?.workspace_id ||
      null;

    const apiBase = process.env.API_BASE ?? "https://api.yarnnn.com";
    const upstream = await fetch(`${apiBase}/api/dumps/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(workspaceId ? { "X-Workspace-Id": String(workspaceId) } : {}),
        "X-Req-Id": reqId,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error("dumps/new upstream error", {
        reqId,
        status: upstream.status,
        text: text.slice(0, 500),
      });
      return new Response(text || `Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") ?? "text/plain",
        },
      });
    }

    return new Response(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: e.issues }, { status: 400 });
    }
    console.error("dumps/new route crash", { reqId, err: String(e?.message ?? e) });
    return Response.json({ error: "Bad gateway", reqId }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

