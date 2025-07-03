import { render } from "@testing-library/react";
import BlocksPane from "@/components/blocks/BlocksPane";
import type { BlockWithHistory } from "@/types/block";
import React from "react";

test("renders diff card when previous revision exists", () => {
  const blocks: BlockWithHistory[] = [
    {
      id: "b1",
      semantic_type: "tone",
      content: "new text here",
      prev_rev_id: "p1",
      prev_content: "old text",
      state: "PROPOSED",
      scope: null,
      canonical_value: null,
    },
    {
      id: "b2",
      semantic_type: "tone",
      content: "another",
      state: "PROPOSED",
      scope: null,
      canonical_value: null,
    },
  ];
  render(<BlocksPane blocks={blocks} />);
  expect(document.querySelector(".diff-added")).toBeInTheDocument();
});

test("renders proposed block styling for new blocks", () => {
  const blocks: BlockWithHistory[] = [
    {
      id: "p1",
      semantic_type: "tone",
      content: "brand new",
      state: "PROPOSED",
      scope: null,
      canonical_value: null,
    },
  ];
  const { container } = render(<BlocksPane blocks={blocks} />);
  expect(container.querySelector(".block-proposed")).toBeInTheDocument();
});
