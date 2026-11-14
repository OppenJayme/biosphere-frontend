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
  type MuseumClock,
  type ScheduleInput,
  type ScheduleRules,
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

export const MAX_VEHICLES = 10;
/** Philippine plates are about 7 characters ("ABC 1234"); 15 leaves room for conduction stickers. */
export const PLATE_NUMBER_MAX = 15;
export const VEHICLE_TEXT_MAX = 40;
/** visit_request_visitor.visitor_name is 100 characters: first name, a space, and last name. */
export const FIRST_NAME_MAX = 50;
export const LAST_NAME_MAX = 49;

const vehicleSchema = z.object({
  plateNumber: requiredText("the plate number", PLATE_NUMBER_MAX),
  carBrand: optionalText("the car brand", VEHICLE_TEXT_MAX),
  carType: optionalText("the car type", VEHICLE_TEXT_MAX),
});

export type VehicleField = keyof z.input<typeof vehicleSchema>;

export type VisitFormField = keyof z.input<typeof visitFieldsSchema> | "schedules" | "visitors";

export type VisitRequestSubmission = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  address?: string;
  purpose: string;
  preferredSchedules: ScheduleInput[];
  visitorCount: number;
  visitors: { firstName: string; lastName: string }[];
  bringingVehicle: boolean;
  vehicles?: z.output<typeof vehicleSchema>[];
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
      /** One entry per vehicle row, in form order; empty when that row is valid. */
      vehicleErrors: FieldErrors<VehicleField>[];
      /** One entry per visitor name row, in form order; undefined when that row is valid. */
      visitorErrors: (string | undefined)[];
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

/**
 * Campus entry needs everyone's name, so every visitor row needs a first and a last name. The form
 * shows one row per visitor; the count check is in readVisitRequestForm.
 */
function readVisitors(formData: FormData) {
  const lastNames = stringValues(formData, "visitorLastName");
  const visitors: { firstName: string; lastName: string }[] = [];
  const rowErrors = stringValues(formData, "visitorFirstName").map((rawFirst, index) => {
    const firstName = rawFirst.trim();
    const lastName = (lastNames[index] ?? "").trim();
    if (!firstName && !lastName) return "Enter this visitor's first and last name.";
    if (!firstName) return "Enter this visitor's first name.";
    if (!lastName) return "Enter this visitor's last name.";
    if (firstName.length > FIRST_NAME_MAX) return `Keep first names to ${FIRST_NAME_MAX} characters or fewer.`;
    if (lastName.length > LAST_NAME_MAX) return `Keep last names to ${LAST_NAME_MAX} characters or fewer.`;
    visitors.push({ firstName, lastName });
    return undefined;
  });

  return { visitors, rowErrors };
}

/** Vehicle rows come in as parallel plateNumber/carBrand/carType lists, in form order. */
function readVehicles(formData: FormData) {
  const brands = stringValues(formData, "carBrand");
  const types = stringValues(formData, "carType");
  const rows = stringValues(formData, "plateNumber").map((plateNumber, index) =>
    vehicleSchema.safeParse({ plateNumber, carBrand: brands[index] ?? "", carType: types[index] ?? "" }),
  );

  // Matches the backend: spacing, hyphens and case don't change a plate.
  const seenPlates = new Set<string>();
  const rowErrors = rows.map((row): FieldErrors<VehicleField> => {
    if (!row.success) return collectFieldErrors<VehicleField>(row.error);

    const plate = row.data.plateNumber.replace(/[\s-]+/g, "").toUpperCase();
    if (seenPlates.has(plate)) return { plateNumber: "This plate number is already listed." };
    seenPlates.add(plate);
    return {};
  });

  return {
    vehicles: rows.flatMap((row) => (row.success ? [row.data] : [])),
    rowErrors,
    valid: rowErrors.every((errors) => Object.keys(errors).length === 0),
  };
}

export function readVisitRequestForm(
  formData: FormData,
  clock?: MuseumClock | string,
  rules?: ScheduleRules,
): VisitFormResult {
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
  const vehicleCheck = bringingVehicle ? readVehicles(formData) : { vehicles: [], rowErrors: [], valid: true };

  const schedules = readScheduleRows(formData);
  const scheduleCheck = validateSchedules(schedules, clock, rules);
  const { visitors, rowErrors: visitorErrors } = readVisitors(formData);

  const errors: FieldErrors<VisitFormField> = {};
  if (!fields.success) Object.assign(errors, collectFieldErrors<VisitFormField>(fields.error));
  if (scheduleCheck.listError) errors.schedules = scheduleCheck.listError;
  const visitorsValid = visitorErrors.every((error) => !error);
  if (fields.success && visitorErrors.length !== fields.data.visitorCount) {
    const count = fields.data.visitorCount;
    errors.visitors = `Enter a first and last name for each of the ${count} visitor${count === 1 ? "" : "s"}.`;
  } else if (!visitorsValid) {
    errors.visitors = "Enter a first and last name for every visitor.";
  }

  if (!fields.success || !vehicleCheck.valid || !scheduleCheck.valid || errors.visitors) {
    return {
      success: false,
      errors,
      scheduleErrors: scheduleCheck.rowErrors,
      vehicleErrors: vehicleCheck.rowErrors,
      visitorErrors,
    };
  }

  const { consent, ...contact } = fields.data;
  void consent;
  return {
    success: true,
    data: {
      ...contact,
      preferredSchedules: schedules,
      visitors,
      bringingVehicle,
      ...(vehicleCheck.vehicles.length > 0 ? { vehicles: vehicleCheck.vehicles } : {}),
      consentAccepted: true,
    },
  };
}
