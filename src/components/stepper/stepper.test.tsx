import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper, type StepperStep } from "./stepper";

const steps: StepperStep[] = [
  { key: "incident", label: "Incident", status: "completed", detail: "17 Nov" },
  { key: "investigation", label: "Investigation", status: "completed", detail: "20 Nov" },
  { key: "notice", label: "Notice", status: "completed", detail: "Mon 23 Nov" },
  { key: "hearing", label: "Hearing", status: "current", detail: "Thu 26 Nov, 10:00" },
  {
    key: "outcome",
    label: "Outcome",
    status: "blocked",
    reason: "Record the employee's side of the story before deciding the outcome.",
  },
  { key: "appeal", label: "Appeal", status: "upcoming", optional: true },
];

describe("Stepper", () => {
  it("lists every step in order", () => {
    render(<Stepper steps={steps} />);
    const items = within(screen.getByRole("list", { name: "Case progress" })).getAllByRole(
      "listitem",
    );
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Incident"),
      expect.stringContaining("Investigation"),
      expect.stringContaining("Notice"),
      expect.stringContaining("Hearing"),
      expect.stringContaining("Outcome"),
      expect.stringContaining("Appeal"),
    ]);
  });

  it("marks only the current step with aria-current", () => {
    render(<Stepper steps={steps} />);
    const current = screen.getAllByRole("listitem").filter((li) => li.hasAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("aria-current", "step");
    expect(current[0]).toHaveTextContent("Hearing");
  });

  it("tells screen readers the status of each step", () => {
    render(<Stepper steps={steps} />);
    const [incident, , , hearing, outcome, appeal] = screen.getAllByRole("listitem");
    expect(incident).toHaveTextContent("Completed");
    expect(hearing).toHaveTextContent("Current step");
    expect(outcome).toHaveTextContent("Blocked");
    expect(appeal).toHaveTextContent("Not started");
  });

  it("shows the plain-language reason on a blocked step", () => {
    render(<Stepper steps={steps} />);
    expect(
      screen.getByText("Record the employee's side of the story before deciding the outcome."),
    ).toBeInTheDocument();
  });

  it("shows dates or details and marks optional steps", () => {
    render(<Stepper steps={steps} />);
    expect(screen.getByText("Thu 26 Nov, 10:00")).toBeInTheDocument();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("can stay vertical at every screen size", () => {
    render(<Stepper steps={steps} vertical />);
    const list = screen.getByRole("list", { name: "Case progress" });
    expect(list).toHaveClass("flex-col");
    expect(list).not.toHaveClass("md:flex-row");
  });

  it("can be shown as a compact bar without details", () => {
    render(<Stepper steps={steps} compact />);
    expect(screen.queryByText("Thu 26 Nov, 10:00")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });
});
