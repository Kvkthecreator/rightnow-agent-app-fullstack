import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: Request,
  NextResponse: {
    json: (body: any, init?: any) =>
      new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("@/lib/supabaseServerClient", () => ({
  createServerSupabaseClient: () => ({}),
}));

vi.mock("@/lib/workspaces/ensureWorkspaceServer", () => ({
  ensureWorkspaceServer: async () => ({}),
}));

import { GET as getState } from "@/app/api/baskets/[id]/state/route";
import { GET as getDocs } from "@/app/api/baskets/[id]/documents/route";
import { GET as getProposals } from "@/app/api/baskets/[id]/proposals/route";
import { GET as getBuildingBlocks } from "@/app/api/baskets/[id]/building-blocks/route";
import { GET as getTimeline } from "@/app/api/baskets/[id]/timeline/route";
import { GET as getDocument } from "@/app/api/documents/[docId]/route";

beforeAll(() => {
  process.env.MOCK_BASKET_API = "1";
});

describe("basket api", () => {
  it("returns state", async () => {
    const res = await getState(new Request("http://test"), { params: { id: "b1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.basket_id).toBe("b1");
  });

  it("returns documents", async () => {
    const res = await getDocs(new Request("http://test"), { params: { id: "b1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("returns proposals", async () => {
    const res = await getProposals(new Request("http://test"), { params: { id: "b1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("returns blocks", async () => {
    const res = await getBuildingBlocks(new Request("http://test"), { params: { id: "b1" } });
    expect(res.status).toBe(200);
  });

  it("returns timeline", async () => {
    const res = await getTimeline(new Request("http://test"), { params: { id: "b1" } });
    expect(res.status).toBe(200);
  });

  it("returns document detail", async () => {
    const res = await getDocument(new Request("http://test"), { params: { docId: "d1" } });
    expect(res.status).toBe(200);
  });
});
