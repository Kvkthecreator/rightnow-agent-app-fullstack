import { render, screen } from "@testing-library/react";
import CommitTimeline from "@/components/timeline/CommitTimeline";
import { SWRConfig } from "swr";
import React from "react";

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () =>
    Promise.resolve([
      { id: "c1", created_at: "2025-01-01", summary: "Dump A", new_blocks: 2, edited_blocks: 0, supersedes: 0 },
      { id: "c2", created_at: "2025-01-02", summary: "Dump B", new_blocks: 1, edited_blocks: 0, supersedes: 1 },
    ]),
}) as any;

it("renders commits list", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <CommitTimeline basketId="b1" />
    </SWRConfig>,
  );
  expect(await screen.findByText("Dump A")).toBeInTheDocument();
  expect(await screen.findByText("Dump B")).toBeInTheDocument();
});
