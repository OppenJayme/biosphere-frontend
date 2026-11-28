/**
 * The Request-a-Visit form is split into short steps so a visitor sees one kind of question at a
 * time (panel feedback: the single long form was too much at once). Every step stays in the same
 * <form>, so readVisitRequestForm still checks the whole request; these helpers decide which of its
 * errors belong to the step on screen.
 */

import type { FieldErrors } from "../public-submissions/form-fields";
import type { VehicleField, VisitFormField } from "./form";

export const VISIT_FORM_STEPS = [
  { title: "Your details", fields: ["name", "email", "phone", "organization", "address", "purpose"] },
  { title: "Preferred dates", fields: ["schedules"] },
  { title: "Visitors", fields: ["visitorCount", "visitors"] },
  { title: "Final details", fields: ["equipment", "notes", "consent"] },
] as const satisfies readonly { title: string; fields: readonly VisitFormField[] }[];

export const SCHEDULE_STEP = 1;
export const VISITORS_STEP = 2;
export const LAST_VISIT_STEP = VISIT_FORM_STEPS.length - 1;

/** The failed result of readVisitRequestForm. */
export type VisitFormFailure = {
  errors: FieldErrors<VisitFormField>;
  scheduleErrors: (string | undefined)[];
  vehicleErrors: FieldErrors<VehicleField>[];
  visitorErrors: (string | undefined)[];
};

/** The parts of a failed check that the given step shows; the rest are left empty. */
export function errorsForStep(step: number, failure: VisitFormFailure): VisitFormFailure {
  const fields: readonly VisitFormField[] = VISIT_FORM_STEPS[step]?.fields ?? [];
  const errors: FieldErrors<VisitFormField> = {};
  for (const field of fields) {
    if (failure.errors[field]) errors[field] = failure.errors[field];
  }
  return {
    errors,
    scheduleErrors: step === SCHEDULE_STEP ? failure.scheduleErrors : [],
    // Vehicles are asked on the Visitors step.
    vehicleErrors: step === VISITORS_STEP ? failure.vehicleErrors : [],
    visitorErrors: step === VISITORS_STEP ? failure.visitorErrors : [],
  };
}

export function stepHasErrors(step: number, failure: VisitFormFailure): boolean {
  const own = errorsForStep(step, failure);
  return (
    Object.values(own.errors).some(Boolean) ||
    own.scheduleErrors.some(Boolean) ||
    own.visitorErrors.some(Boolean) ||
    own.vehicleErrors.some((row) => Object.values(row).some(Boolean))
  );
}

/** The earliest step with a problem, where the form returns to after a failed final submit. */
export function firstStepWithErrors(failure: VisitFormFailure): number {
  const step = VISIT_FORM_STEPS.findIndex((_, index) => stepHasErrors(index, failure));
  return step === -1 ? LAST_VISIT_STEP : step;
}
