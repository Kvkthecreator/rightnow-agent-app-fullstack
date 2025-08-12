import { postDump } from "@/lib/baskets/dumpApi";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com';

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        input_id: "in1",
        chunk_ids: ["blk1", "blk2"],
        warning: "too_many_blocks",
      }),
  }) as any;
});

it("sends FormData and returns warning", async () => {
  const resp = await postDump({
    basketId: "bkt",
    userId: "u1",
    text: "hello",
  });
  expect(resp.warning).toBe("too_many_blocks");
  // ensure fetch called with FormData
  const call = (global.fetch as any).mock.calls[0];
  expect(call[0]).toBe(`${API_BASE_URL}/api/dump`);
  expect(call[1].body).toBeInstanceOf(FormData);
});

