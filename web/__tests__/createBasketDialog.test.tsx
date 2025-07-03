import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import CreateBasketDialog from "@/components/CreateBasketDialog";

const push = vi.fn();
const mutate = vi.fn().mockResolvedValue("uuid-1");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/hooks/useCreateBasket", () => ({
  useCreateBasket: () => ({ mutate }),
}));

describe("CreateBasketDialog", () => {
  it("creates basket and routes", async () => {
    render(<CreateBasketDialog open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByLabelText(/basket name/i), "Test");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /create basket/i }));

    expect(mutate).toHaveBeenCalledWith("Test", "brand_playbook");
    expect(push).toHaveBeenCalledWith("/baskets/uuid-1/work");
  });
});
