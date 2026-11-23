import { z } from "zod";

const body = z.string().trim().max(4000, { error: "Use 4,000 characters or fewer." });

/** A comment on a case, by the owner or the assigned consultant. */
export const commentSchema = z.object({
  body: body.min(1, { error: "Write a comment first." }),
});

/** A consultant's review. Requesting changes needs a comment saying what to fix. */
export const reviewSchema = z
  .object({
    decision: z.enum(["approve", "changes"], { error: "Choose approve or request changes." }),
    body: body.transform((value) => (value === "" ? undefined : value)),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "changes" && !value.body) {
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Explain what needs to change, so the owner can fix it.",
      });
    }
  });
