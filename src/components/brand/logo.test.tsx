import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "./logo";

describe("Logo", () => {
  it("shows the wordmark next to the mark by default", () => {
    render(<Logo />);
    expect(screen.getByText("FairStep")).toBeInTheDocument();
  });

  it("gives the mark an accessible name when shown on its own", () => {
    render(<Logo showWordmark={false} />);
    expect(screen.getByRole("img", { name: "FairStep" })).toBeInTheDocument();
  });

  it("hides the mark from screen readers when the wordmark already names it", () => {
    render(<Logo />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders three steps and the ochre dot", () => {
    const { container } = render(<LogoMark title="FairStep" />);
    expect(container.querySelectorAll("rect")).toHaveLength(3);
    expect(container.querySelector("circle")).toHaveAttribute("fill", "var(--color-accent)");
  });
});
