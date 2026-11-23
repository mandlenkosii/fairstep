import { z } from "zod";

/**
 * Employee form rules, shared by the form and the server action.
 * POPIA: only what a case needs. There is deliberately no field for ID
 * numbers, home addresses, banking or medical details.
 */

const required = (message: string, max = 80) =>
  z
    .string()
    .trim()
    .min(1, { error: message })
    .max(max, { error: `Use ${max} characters or fewer.` });

/** Empty input becomes null, so optional columns stay empty in the database. */
const optional = (schema: z.ZodType<string, string>) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), schema]));

function isRealDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const employeeSchema = z.object({
  firstName: required("Enter a first name."),
  lastName: required("Enter a last name."),
  employeeNumber: optional(z.string().max(40, { error: "Use 40 characters or fewer." })),
  jobTitle: required("Enter a job title."),
  startDate: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value), {
      error: "Enter the start date.",
    }),
  workPhone: optional(
    z
      .string()
      .regex(/^\+?[0-9][0-9 ]{8,18}$/, { error: "Enter a phone number like 082 123 4567." }),
  ),
  workEmail: optional(
    z.email({ error: "Enter a valid email address, like name@business.co.za." }).max(254),
  ),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const EMPLOYEE_FIELDS = Object.keys(employeeSchema.shape) as (keyof EmployeeInput)[];

export function toEmployeeRow(input: EmployeeInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    employee_number: input.employeeNumber,
    job_title: input.jobTitle,
    start_date: input.startDate,
    work_phone: input.workPhone,
    work_email: input.workEmail,
  };
}
