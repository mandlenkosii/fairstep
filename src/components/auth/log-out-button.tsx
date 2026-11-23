import { LogOut } from "lucide-react";
import { logOut } from "@/app/(auth)/actions";

/** A small form, so logging out works even before JavaScript loads. */
export function LogOutButton() {
  return (
    <form action={logOut}>
      <button
        type="submit"
        aria-label="Log out"
        title="Log out"
        className="inline-flex size-11 items-center justify-center rounded-lg text-muted hover:bg-primary-tint hover:text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        <LogOut aria-hidden className="size-5" />
      </button>
    </form>
  );
}
