import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginForm, SignupForm } from "./auth-forms";

describe("LoginForm", () => {
  it("shows the server's field errors under the right inputs", async () => {
    const action = vi.fn(async () => ({
      fieldErrors: { email: "Enter a valid email address, like name@business.co.za." },
      values: { email: "thabo" },
    }));
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Work email"), "thabo");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    const email = await screen.findByLabelText("Work email");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(
      "Enter a valid email address, like name@business.co.za.",
    );
    expect(email).toHaveValue("thabo");
    expect(action).toHaveBeenCalledOnce();
  });

  it("announces a form-level error", async () => {
    const action = vi.fn(async () => ({ formError: "That email and password don't match." }));
    render(<LoginForm action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That email and password don't match.",
    );
  });
});

describe("SignupForm", () => {
  it("asks only for name, business, email and password", () => {
    render(<SignupForm action={vi.fn(async () => ({}))} />);
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Start your free trial" })).toBeInTheDocument();
  });
});
