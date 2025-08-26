import { test, expect } from "@playwright/test";

test("truncates oversize memory_paste without 422", async ({ request }) => {
  const payload = {
    basket_id: "1c4955b8-da82-453b-afa2-478b38279eae",
    name: "Kevin Kim",
    tension: "i'm trying to build my web app",
    aspiration: "get to know myself",
    memory_paste: "A".repeat(20500),
  };
  const res = await request.post("/api/onboarding/complete", { data: payload });
  expect(res.status()).toBe(200);
  expect(res.headers()["x-memory-paste-truncated"]).toBe("1");
  const json = await res.json();
  expect(json.truncated_memory_paste).toBe(true);
});
