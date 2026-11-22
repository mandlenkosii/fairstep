import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Landing page", () => {
  it("leads with the tagline and pitch", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Every step fair. Every step on record.",
    );
    expect(
      screen.getByText(/run fair, fully documented disciplinary processes/i),
    ).toBeInTheDocument();
  });

  it("sends visitors to sign up and log in", () => {
    render(<Home />);
    const trialLinks = screen.getAllByRole("link", { name: /free trial/i });
    expect(trialLinks.length).toBeGreaterThan(0);
    trialLinks.forEach((link) => expect(link).toHaveAttribute("href", "/signup"));
    screen
      .getAllByRole("link", { name: "Log in" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });

  it("backs the CCMA numbers with linked sources", () => {
    render(<Home />);
    const stats = screen.getByRole("region", { name: /the problem/i });
    expect(within(stats).getByText("193,069")).toBeInTheDocument();
    expect(within(stats).getByText("51%")).toBeInTheDocument();
    within(stats)
      .getAllByRole("link", { name: /business day/i })
      .forEach((link) =>
        expect(link).toHaveAttribute("href", expect.stringContaining("businessday.co.za")),
      );
  });

  it("shows the three plans in rand", () => {
    render(<Home />);
    const pricing = screen.getByRole("region", { name: /pricing/i });
    for (const price of ["R149", "R299", "R799"]) {
      expect(within(pricing).getByText(price)).toBeInTheDocument();
    }
  });

  it("uses the 2025 Code and never says Schedule 8", () => {
    const { container } = render(<Home />);
    expect(container).toHaveTextContent("Code of Good Practice: Dismissal");
    expect(container).not.toHaveTextContent(/schedule 8/i);
    expect(container).toHaveTextContent("2 working days");
  });

  it("says it is not legal advice", () => {
    render(<Home />);
    expect(screen.getAllByText(/not legal advice/i).length).toBeGreaterThan(0);
  });
});
