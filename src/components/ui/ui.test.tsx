import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "./badge";
import { Button, ButtonLink } from "./button";
import { Card } from "./card";
import { Field, Input, Select, Textarea } from "./field";

describe("Button", () => {
  it("is a primary button by default and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save incident</Button>);
    const button = screen.getByRole("button", { name: "Save incident" });
    expect(button).toHaveClass("to-primary");
    expect(button).toHaveAttribute("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is at least 44px tall for touch", () => {
    render(<Button>Log in</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-11");
  });

  it("shows a busy state and blocks clicks while pending", async () => {
    const onClick = vi.fn();
    render(
      <Button pending onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports other variants", () => {
    render(<Button variant="danger">Archive</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-danger");
  });

  it("renders a link styled as a button", () => {
    render(<ButtonLink href="/signup">Start your free trial</ButtonLink>);
    expect(screen.getByRole("link", { name: "Start your free trial" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});

describe("Badge", () => {
  it("uses readable text colours for each tone", () => {
    render(
      <>
        <Badge tone="warning">Hearing scheduled</Badge>
        <Badge tone="success">Approved</Badge>
      </>,
    );
    expect(screen.getByText("Hearing scheduled")).toHaveClass("text-warning-strong");
    expect(screen.getByText("Approved")).toHaveClass("text-success-strong");
  });
});

describe("Card", () => {
  it("renders its children on a surface", () => {
    render(<Card>Open cases</Card>);
    expect(screen.getByText("Open cases")).toHaveClass("bg-surface");
  });
});

describe("Field", () => {
  it("links the label, hint and input", () => {
    render(
      <Field label="Job title" hint="As it appears on the contract" required>
        <Input name="job_title" />
      </Field>,
    );
    const input = screen.getByLabelText(/job title/i);
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription("As it appears on the contract");
  });

  it("shows an inline error and marks the input invalid", () => {
    render(
      <Field label="Location" error="Tell us where it happened.">
        <Textarea name="location" />
      </Field>,
    );
    const input = screen.getByLabelText("Location");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Tell us where it happened.");
    expect(screen.getByText("Tell us where it happened.")).toHaveClass("text-danger");
  });

  it("works with a select", () => {
    render(
      <Field label="Category">
        <Select name="category" defaultValue="late">
          <option value="late">Late coming / absence</option>
          <option value="theft">Dishonesty / theft</option>
        </Select>
      </Field>,
    );
    expect(screen.getByLabelText("Category")).toHaveValue("late");
  });
});
