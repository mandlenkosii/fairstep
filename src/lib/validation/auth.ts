import { z } from "zod";

/** Shared by the forms (for messages) and the server actions (as the real check). */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address, like name@business.co.za." }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, { error: "Enter your name." }).max(100),
  businessName: z.string().trim().min(1, { error: "Enter your business name." }).max(120),
  email,
  password: z
    .string()
    .min(8, { error: "Use at least 8 characters." })
    .max(72, { error: "Use 72 characters or fewer." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

/** Turns a zod error into { field: "first message" } for showing under each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}
