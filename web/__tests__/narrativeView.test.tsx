import { render, screen } from "@testing-library/react";
import NarrativeView from "@/components/work/NarrativeView";
import { SWRConfig } from "swr";
import React from "react";

vi.mock("@/lib/baskets/useInputs", () => ({
  useInputs: () => ({
    inputs: [{ id: "i1", content: "# Hello world" }],
    isLoading: false,
  }),
}));
vi.mock("@/lib/baskets/useBlocks", () => ({
  useBlocks: () => ({
    blocks: [
      { id: "b1", label: "Hello", type: "note", updated_at: "", commit_id: null },
    ],
    isLoading: false,
  }),
}));
vi.mock("@/lib/baskets/useHighlights", () => ({
  useHighlights: () => ({
    highlights: [
      { dump_input_id: "i1", conflicting_block_id: "b1", reason: "possible_redundancy" },
    ],
    isLoading: false,
  }),
}));
vi.mock("@supabase/auth-helpers-react", () => ({
  useSessionContext: () => ({ session: null }),
}));

it("renders markdown", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <NarrativeView basketId="b1" />
    </SWRConfig>,
  );
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

it("shows highlight indicator", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <NarrativeView basketId="b1" />
    </SWRConfig>,
  );
  expect(await screen.findByTitle(/possible_redundancy/i)).toBeInTheDocument();
});
