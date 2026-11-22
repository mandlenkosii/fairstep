import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";
import { DISCLAIMER } from "./disclaimer";

const pathname = vi.hoisted(() => ({ current: "/app" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const owner = { name: "Thabo Mokoena", subtitle: "Kasi Kitchen" };

describe("AppShell", () => {
  beforeEach(() => {
    pathname.current = "/app";
  });

  it("shows the owner's navigation in the sidebar", () => {
    render(
      <AppShell role="business_owner" user={owner}>
        <p>Page content</p>
      </AppShell>,
    );
    const sidebar = screen.getByRole("navigation", { name: "Main" });
    for (const name of ["Dashboard", "Employees", "Incidents", "Cases"]) {
      expect(within(sidebar).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("marks the current page, including nested pages", () => {
    pathname.current = "/app/employees/123";
    render(
      <AppShell role="business_owner" user={owner}>
        <p />
      </AppShell>,
    );
    const sidebar = screen.getByRole("navigation", { name: "Main" });
    expect(within(sidebar).getByRole("link", { name: "Employees" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(sidebar).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("gives consultants and admins their own navigation", () => {
    const { unmount } = render(
      <AppShell role="consultant" user={{ name: "Naledi Dlamini", subtitle: "Consultant" }}>
        <p />
      </AppShell>,
    );
    expect(
      within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", {
        name: "Review queue",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Employees" })).not.toBeInTheDocument();
    unmount();

    render(
      <AppShell role="admin" user={{ name: "FairStep Admin", subtitle: "Platform" }}>
        <p />
      </AppShell>,
    );
    expect(
      within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", {
        name: "Businesses",
      }),
    ).toBeInTheDocument();
  });

  it("has a mobile tab bar and shows who is signed in", () => {
    render(
      <AppShell role="business_owner" user={owner}>
        <p />
      </AppShell>,
    );
    expect(screen.getByRole("navigation", { name: "Tabs" })).toBeInTheDocument();
    expect(screen.getAllByText("Thabo Mokoena").length).toBeGreaterThan(0);
  });

  it("always shows the not-legal-advice disclaimer", () => {
    render(
      <AppShell role="business_owner" user={owner}>
        <p />
      </AppShell>,
    );
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });
});
