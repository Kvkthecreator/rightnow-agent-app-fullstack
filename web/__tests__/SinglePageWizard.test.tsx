import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { vi } from "vitest";
import SinglePageWizard from "@/components/wizard/SinglePageWizard";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ basket_id: "b1" }),
}) as any;

describe("SinglePageWizard", () => {
  it("cannot submit with 0 dumps", () => {
    render(<SinglePageWizard />);
    const btn = screen.getByRole("button", { name: /create basket/i });
    expect(btn).toBeDisabled();
  });

  it("submitting valid form triggers fetch and router.push", async () => {
    render(<SinglePageWizard />);
    await userEvent.type(screen.getByLabelText(/basket name/i), "Test Basket");
    const coreText = "a".repeat(100);
    await userEvent.type(screen.getByLabelText(/core block/i), coreText);
    await userEvent.click(screen.getByRole("button", { name: /add dump/i }));
    await userEvent.type(screen.getByLabelText(/dump 1/i), "Hello dump");
    await userEvent.click(screen.getByRole("button", { name: /create basket/i }));
    expect(global.fetch).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/baskets/b1/work");
  });
});
