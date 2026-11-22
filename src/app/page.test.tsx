import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("shows the FairStep name and tagline", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "FairStep" })).toBeInTheDocument();
    expect(screen.getByText("Every step fair. Every step on record.")).toBeInTheDocument();
  });
});
