import { describe, expect, it } from "vitest";
import { errorsForStep, firstStepWithErrors, stepHasErrors, type VisitFormFailure } from "./form-steps";

const none: VisitFormFailure = { errors: {}, scheduleErrors: [], vehicleErrors: [], visitorErrors: [] };

describe("visit request form steps", () => {
  it("shows each step only its own errors", () => {
    const failure: VisitFormFailure = {
      errors: { email: "Enter a valid email.", visitorCount: "At least 1 visitor is required.", consent: "Agree first." },
      scheduleErrors: ["That time is booked."],
      vehicleErrors: [{ plateNumber: "Enter the plate number." }],
      visitorErrors: [undefined, "Enter a last name."],
    };
    expect(errorsForStep(0, failure)).toEqual({ ...none, errors: { email: "Enter a valid email." } });
    expect(errorsForStep(1, failure)).toEqual({ ...none, scheduleErrors: ["That time is booked."] });
    expect(errorsForStep(2, failure)).toEqual({
      errors: { visitorCount: "At least 1 visitor is required." },
      scheduleErrors: [],
      vehicleErrors: [{ plateNumber: "Enter the plate number." }],
      visitorErrors: [undefined, "Enter a last name."],
    });
    expect(errorsForStep(3, failure)).toEqual({ ...none, errors: { consent: "Agree first." } });
  });

  it("lets a step continue when only later steps have problems", () => {
    // A fresh form fails on the unticked consent box, which must not block the first step.
    const consentOnly: VisitFormFailure = { ...none, errors: { consent: "Agree first." } };
    expect(stepHasErrors(0, consentOnly)).toBe(false);
    expect(stepHasErrors(2, consentOnly)).toBe(false);
    expect(stepHasErrors(3, consentOnly)).toBe(true);
    // Empty row entries (rows without a problem) do not count.
    expect(stepHasErrors(2, { ...none, visitorErrors: [undefined], vehicleErrors: [{}] })).toBe(false);
  });

  it("returns to the earliest step with a problem", () => {
    expect(firstStepWithErrors({ ...none, scheduleErrors: [undefined, "Closed on Sunday."] })).toBe(1);
    expect(firstStepWithErrors({ ...none, errors: { visitors: "Enter every name.", name: "Enter a name." } })).toBe(0);
    expect(firstStepWithErrors({ ...none, errors: { schedules: "Add a schedule." } })).toBe(1);
    expect(firstStepWithErrors(none)).toBe(3);
  });
});
