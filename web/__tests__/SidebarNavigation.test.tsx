import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Sidebar from "@/app/components/shell/Sidebar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/baskets/getAllBaskets", () => ({
  getAllBaskets: vi.fn().mockResolvedValue([
    { id: "b1", name: "First Basket" },
  ]),
}));

vi.mock("@/lib/supabase/clients", () => ({
  createBrowserClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: "test@example.com" } } }),
    },
  }),
}));

describe("Sidebar navigation", () => {
  it("routes basket entries to their dashboard", async () => {
    render(<Sidebar />);
    const basketButton = await screen.findByRole("button", { name: /first basket/i });
    await userEvent.click(basketButton);
    expect(push).toHaveBeenCalledWith("/baskets/b1/dashboard");
  });
});

