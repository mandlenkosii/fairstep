import { describe, expect, it } from "vitest";
import { employeeSchema, toEmployeeRow } from "./employee";

const valid = {
  firstName: " Bongani ",
  lastName: "Dube",
  employeeNumber: "",
  jobTitle: "Waiter",
  startDate: "2026-12-01",
  workPhone: "",
  workEmail: "",
};

describe("employeeSchema", () => {
  it("accepts the required fields and trims them", () => {
    const parsed = employeeSchema.parse(valid);
    expect(parsed.firstName).toBe("Bongani");
  });

  it("turns empty optional fields into null", () => {
    const parsed = employeeSchema.parse(valid);
    expect(parsed.employeeNumber).toBeNull();
    expect(parsed.workPhone).toBeNull();
    expect(parsed.workEmail).toBeNull();
  });

  it.each([
    ["firstName", "", "Enter a first name."],
    ["lastName", "  ", "Enter a last name."],
    ["jobTitle", "", "Enter a job title."],
    ["startDate", "", "Enter the start date."],
    ["startDate", "01/12/2026", "Enter the start date."],
    ["startDate", "2026-02-30", "Enter the start date."],
    ["workPhone", "phone me", "Enter a phone number like 082 123 4567."],
    ["workEmail", "bongani@", "Enter a valid email address, like name@business.co.za."],
  ])("rejects %s = %j with a plain message", (field, value, message) => {
    const result = employeeSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: [field], message });
  });

  it("accepts SA phone formats", () => {
    for (const workPhone of ["082 123 4567", "0821234567", "+27 82 123 4567"]) {
      expect(employeeSchema.safeParse({ ...valid, workPhone }).success).toBe(true);
    }
  });

  it("has no field for ID numbers or home addresses (POPIA)", () => {
    const parsed = employeeSchema.parse({
      ...valid,
      idNumber: "9001015009087",
      homeAddress: "1 Main Rd",
    });
    expect(parsed).not.toHaveProperty("idNumber");
    expect(parsed).not.toHaveProperty("homeAddress");
  });
});

describe("toEmployeeRow", () => {
  it("maps form fields to database columns", () => {
    expect(toEmployeeRow(employeeSchema.parse({ ...valid, workPhone: "082 123 4567" }))).toEqual({
      first_name: "Bongani",
      last_name: "Dube",
      employee_number: null,
      job_title: "Waiter",
      start_date: "2026-12-01",
      work_phone: "082 123 4567",
      work_email: null,
    });
  });
});
