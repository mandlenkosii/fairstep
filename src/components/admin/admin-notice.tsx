import { AlertCircle, CheckCircle2 } from "lucide-react";

const DONE: Record<string, string> = {
  assigned: "Consultant assigned. They can now see and review this business’s cases.",
  unassigned: "Consultant removed. They can no longer see this business.",
  role: "Role updated.",
};
const ERRORS: Record<string, string> = {
  "choose-consultant": "Choose a consultant first.",
  "already-assigned": "That consultant is already assigned to this business.",
  "own-role": "You can’t change your own role. Ask another admin.",
  "save-failed": "We couldn’t save that. Please try again.",
};

export function AdminNotice({ done, error }: { done?: unknown; error?: unknown }) {
  const success = typeof done === "string" ? DONE[done] : undefined;
  const failure = typeof error === "string" ? ERRORS[error] : undefined;
  if (failure) {
    return (
      <p
        role="alert"
        className="mt-4 flex items-center gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger"
      >
        <AlertCircle aria-hidden className="size-4 shrink-0" />
        {failure}
      </p>
    );
  }
  if (!success) return null;
  return (
    <p
      role="status"
      className="mt-4 flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-sm text-success-strong"
    >
      <CheckCircle2 aria-hidden className="size-4 shrink-0" />
      {success}
    </p>
  );
}
