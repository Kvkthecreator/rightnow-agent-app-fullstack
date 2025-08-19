import { render, screen } from "@testing-library/react";
import BasketCard from "@/components/BasketCard";

describe("BasketCard", () => {
  it("links to the basket dashboard", () => {
    render(
      <BasketCard basket={{ id: "abc123", name: "Test Basket" }} />
    );
    const link = screen.getByRole("link", { name: /test basket/i });
    expect(link).toHaveAttribute("href", "/baskets/abc123/dashboard");
  });
});

