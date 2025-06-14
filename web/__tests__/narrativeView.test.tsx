import { render, screen } from "@testing-library/react";
import NarrativeView from "@/components/work/NarrativeView";
import { SWRConfig } from "swr";
import React from "react";

const mockUseInputs = vi.fn(() => ({
  inputs: [{ id: "i1", content: "# Hello world" }],
  isLoading: false,
}));

vi.mock("@/lib/baskets/useInputs", () => ({
  useInputs: () => mockUseInputs(),
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

it("handles empty inputs gracefully", async () => {
  mockUseInputs.mockReturnValueOnce({ inputs: [{ id: "i2", content: "" }], isLoading: false });
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <NarrativeView basketId="b1" />
    </SWRConfig>,
  );
  expect(await screen.findByText(/no narrative available/i)).toBeInTheDocument();
});

it("handles malformed input without crashing", async () => {
  // @ts-expect-error deliberately pass bad value
  mockUseInputs.mockReturnValueOnce({ inputs: [{ id: "i3", content: undefined }], isLoading: false });
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <NarrativeView basketId="b1" />
    </SWRConfig>,
  );
  expect(await screen.findByText(/no narrative available/i)).toBeInTheDocument();
});
