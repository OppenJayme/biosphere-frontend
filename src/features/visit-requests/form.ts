/** Parses the public Request-a-Visit form into the POST /visit-requests body (SRS REQ-4.9-01 to 06). */

import { z } from "zod";
import {
  collectFieldErrors,
  consentField,
  emailField,
  optionalText,
  requiredPhone,
  requiredText,
  stringValue,
  stringValues,
  type FieldErrors,
} from "../public-submissions/form-fields";
import {
  MAX_VISITOR_COUNT,
  normalizeTime,
  validateSchedules,
  type ScheduleInput,
} from "../public-submissions/schedule";

export const visitorCountField = z.coerce
  .number("Enter the number of visitors.")
  .int("Enter a whole number of visitors.")
  .min(1, "At least 1 visitor is required.")
  .max(MAX_VISITOR_COUNT, `Groups are limited to ${MAX_VISITOR_COUNT} visitors.`);

const visitFieldsSchema = z.object({
  name: requiredText("the contact person's name", 100),
  email: emailField,
  phone: requiredPhone,
  organization: requiredText("the organization or school", 255),
  address: optionalText("the address", 255),
  purpose: requiredText("the purpose of the visit", 1000),
  visitorCount: visitorCountField,
  equipment: optionalText("the equipment list", 500),
  notes: optionalText("the notes", 1000),
  consent: consentField,
});

const vehicleSchema = z.object({
  plateNumber: requiredText("the plate number", 20),
  carBrand: optionalText("the car brand", 100),
  carType: optionalText("the car type", 100),
});

export type VisitFormField =
  | keyof z.input<typeof visitFieldsSchema>
  | keyof z.input<typeof vehicleSchema>
  | "schedules"
  | "visitors";

export type VisitRequestSubmission = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  address?: string;
  purpose: string;
  preferredSchedules: ScheduleInput[];
  visitorCount: number;
  visitors?: { firstName: string; lastName?: string }[];
  bringingVehicle: boolean;
  plateNumber?: string;
  carBrand?: string;
  carType?: string;
  equipment?: string;
  notes?: string;
  consentAccepted: true;
};

export type VisitFormResult =
  | { success: true; data: VisitRequestSubmission }
  | {
      success: false;
      errors: FieldErrors<VisitFormField>;
      /** One entry per schedule row, in form order; undefined when that row is valid. */
      scheduleErrors: (string | undefined)[];
    };

/** Schedule rows come in as parallel scheduleDate/scheduleStart/scheduleEnd lists, in form order. */
export function readScheduleRows(formData: FormData): ScheduleInput[] {
  const dates = stringValues(formData, "scheduleDate");
  const starts = stringValues(formData, "scheduleStart");
  const ends = stringValues(formData, "scheduleEnd");
  return dates.map((date, index) => ({
    date: date.trim(),
    startTime: normalizeTime((starts[index] ?? "").trim()),
    endTime: normalizeTime((ends[index] ?? "").trim()),
  }));
}

/** Visitor rows with both names blank are skipped; a last name needs a first name. */
function readVisitors(formData: FormData) {
  const firstNames = stringValues(formData, "visitorFirstName");
  const lastNames = stringValues(formData, "visitorLastName");
  const visitors: { firstName: string; lastName?: string }[] = [];
  let error: string | undefined;

  firstNames.forEach((rawFirst, index) => {
    const firstName = rawFirst.trim();
    const lastName = (lastNames[index] ?? "").trim();
    if (!firstName && !lastName) return;
    if (!firstName) error ??= "Enter a first name for every visitor you list.";
    else if (firstName.length > 50) error ??= "Keep first names to 50 characters or fewer.";
    else if (lastName.length > 49) error ??= "Keep last names to 49 characters or fewer.";
    else visitors.push(lastName ? { firstName, lastName } : { firstName });
  });

  return { visitors, error };
}

export function readVisitRequestForm(formData: FormData, today?: string): VisitFormResult {
  const fields = visitFieldsSchema.safeParse({
    name: stringValue(formData, "name"),
    email: stringValue(formData, "email"),
    phone: stringValue(formData, "phone"),
    organization: stringValue(formData, "organization"),
    address: stringValue(formData, "address"),
    purpose: stringValue(formData, "purpose"),
    visitorCount: stringValue(formData, "visitorCount").trim(),
    equipment: stringValue(formData, "equipment"),
    notes: stringValue(formData, "notes"),
    consent: formData.get("consent") ?? undefined,
  });

  const bringingVehicle = stringValue(formData, "bringingVehicle") === "true";
  const vehicle = bringingVehicle
    ? vehicleSchema.safeParse({
        plateNumber: stringValue(formData, "plateNumber"),
        carBrand: stringValue(formData, "carBrand"),
        carType: stringValue(formData, "carType"),
      })
    : null;

  const schedules = readScheduleRows(formData);
  const scheduleCheck = validateSchedules(schedules, today);
  const { visitors, error: visitorError } = readVisitors(formData);

  const errors: FieldErrors<VisitFormField> = {};
  if (!fields.success) Object.assign(errors, collectFieldErrors<VisitFormField>(fields.error));
  if (vehicle && !vehicle.success) Object.assign(errors, collectFieldErrors<VisitFormField>(vehicle.error));
  if (scheduleCheck.listError) errors.schedules = scheduleCheck.listError;
  if (visitorError) errors.visitors = visitorError;
  if (fields.success && visitors.length > fields.data.visitorCount) {
    errors.visitors = `You listed ${visitors.length} names but ${fields.data.visitorCount} visitor${
      fields.data.visitorCount === 1 ? "" : "s"
    }. Raise the number of visitors or remove names.`;
  }

  if (!fields.success || (vehicle && !vehicle.success) || !scheduleCheck.valid || errors.visitors) {
    return { success: false, errors, scheduleErrors: scheduleCheck.rowErrors };
  }

  const { consent, ...contact } = fields.data;
  void consent;
  return {
    success: true,
    data: {
      ...contact,
      preferredSchedules: schedules,
      ...(visitors.length > 0 ? { visitors } : {}),
      bringingVehicle,
      ...(vehicle?.success ? vehicle.data : {}),
      consentAccepted: true,
    },
  };
}
