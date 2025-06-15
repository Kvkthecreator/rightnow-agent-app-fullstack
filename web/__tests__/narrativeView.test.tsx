import { render, screen } from "@testing-library/react";
import NarrativeView from "@/components/work/NarrativeView";
import React from "react";

it("renders markdown", () => {
  render(<NarrativeView input={{ content: "# Hello world" }} />);
  expect(screen.getByRole("heading", { name: "Hello world" })).toBeInTheDocument();
});

it("handles empty inputs gracefully", () => {
  render(<NarrativeView input={{ content: "" }} />);
  expect(screen.getByText(/no narrative available/i)).toBeInTheDocument();
});

it("handles malformed input without crashing", () => {
  // @ts-expect-error deliberately pass bad value
  render(<NarrativeView input={{}} />);
  expect(screen.getByText(/no narrative available/i)).toBeInTheDocument();
});
