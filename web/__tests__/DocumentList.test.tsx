import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import DocumentList from "../components/basket/DocumentList";

vi.mock("../lib/baskets/useDocuments", () => ({
  useDocuments: vi.fn(),
}));

import { useDocuments } from "../lib/baskets/useDocuments";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));


it("renders docs and highlights active", () => {
  useDocuments.mockReturnValue({
    docs: [
      { id: "d1", title: "Doc A", updated_at: "2025-01-01" },
      { id: "d2", title: null, updated_at: "2025-01-02" },
      { id: "d3", title: "Doc C", updated_at: "2025-01-03" },
    ],
    isLoading: false,
    error: null,
  });

  render(<DocumentList basketId="b1" activeId="d2" />);

  expect(screen.getByText("Doc A")).toBeInTheDocument();
  expect(screen.getByText("Untitled Document")).toBeInTheDocument();
  const active = screen.getByText("Untitled Document").closest("li");
  expect(active).toHaveClass("ring-2");
});

it("skeleton visible during isLoading", () => {
  useDocuments.mockReturnValue({ docs: [], isLoading: true, error: null });
  render(<DocumentList basketId="b1" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
});
