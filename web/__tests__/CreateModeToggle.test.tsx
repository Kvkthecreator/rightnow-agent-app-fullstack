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

test("query ?mode=blank triggers instant creator", () => {
    currentSearch = "?mode=blank";
    render(<NewBasketPage />);
    expect(screen.getByText(/Creating your basket/i)).toBeInTheDocument();
});

test("toggling updates localStorage", async () => {
    const user = userEvent.setup();
    render(<NewBasketPage />);
    await user.click(screen.getByRole("tab", { name: /blank/i }));
    expect(localStorage.getItem("rn-create-mode")).toBe("blank");
});
