// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import React from 'react';
import { render, screen } from "@testing-library/react";
import StateSnapshot from "@/components/basket/StateSnapshot";

describe("StateSnapshot", () => {
  it("renders basket info", () => {
    render(
      <StateSnapshot
        state={{
          name: "Basket",
          counts: { documents: 1, blocks: 2, context_items: 3 },
          last_updated: "2025-01-01T00:00:00Z",
          current_focus: "Focus",
        }}
      />
    );
    expect(screen.getByText("Basket")).toBeTruthy();
    expect(screen.getByText(/Documents: 1/)).toBeTruthy();
  });
});
