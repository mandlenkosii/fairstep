import type { BadgeTone } from "@/components/ui/badge";

export const REVIEW_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  not_requested: { label: "Not sent for review", tone: "neutral" },
  pending_review: { label: "Waiting for review", tone: "warning" },
  changes_requested: { label: "Changes requested", tone: "danger" },
  approved: { label: "Approved by consultant", tone: "success" },
};

export const ROLE_SHORT: Record<string, string> = {
  business_owner: "Owner",
  consultant: "Consultant",
  admin: "Admin",
};
