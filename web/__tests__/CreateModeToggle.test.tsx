import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";
import NewBasketPage from "@/app/baskets/new/page";

let currentSearch = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

afterEach(() => {
  localStorage.clear();
  currentSearch = "";
});

test("default renders wizard", () => {
  render(<NewBasketPage />);
  expect(screen.getByTestId("wizard")).toBeInTheDocument();
});

test("query ?mode=scratch shows ScratchCreation", () => {
  currentSearch = "?mode=scratch";
  render(<NewBasketPage />);
  expect(screen.getByTestId("scratch")).toBeInTheDocument();
});

test("toggling updates localStorage", async () => {
  const user = userEvent.setup();
  render(<NewBasketPage />);
  await user.click(screen.getByRole("tab", { name: /blank/i }));
  expect(localStorage.getItem("rn-create-mode")).toBe("scratch");
});
