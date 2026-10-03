import { z } from "zod";

// Mirrors the backend visit_request_status enum (SRS REQ-4.9-09).
export const VISIT_REQUEST_STATUSES = [
  "PENDING",
  "APPROVED_BY_CURATOR",
  "SUBMITTED_FOR_CAMPUS_ENTRY",
  "DECLINED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type VisitRequestStatus = (typeof VISIT_REQUEST_STATUSES)[number];

const scheduleFields = {
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
};

export const preferredScheduleSchema = z.object({ ...scheduleFields, preferenceOrder: z.number().int() });
export const approvedScheduleSchema = z.object(scheduleFields);

const visitorSchema = z.object({ name: z.string() });

const vehicleSchema = z.object({
  plateNumber: z.string().nullable(),
  brand: z.string().nullable(),
  type: z.string().nullable(),
});

// Curator-only view of a stored visit request. Nullable columns come back as null, not omitted.
export const visitRequestSchema = z.object({
  id: z.uuid(),
  referenceCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string(),
  phone: z.string(),
  organization: z.string(),
  address: z.string().nullable(),
  purpose: z.string().nullable(),
  visitorCount: z.number().int().nonnegative(),
  preferredSchedules: z.array(preferredScheduleSchema),
  approvedSchedule: approvedScheduleSchema.nullable(),
  sourceInquiryId: z.uuid().nullable(),
  visitors: z.array(visitorSchema),
  vehicles: z.array(vehicleSchema),
  equipment: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.enum(VISIT_REQUEST_STATUSES),
  consentAcceptedAt: z.string(),
  reviewedBy: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const visitRequestListSchema = z.array(visitRequestSchema);

// Approved details the curator copies into the manual USC campus-entry process (REQ-4.9-12).
export const campusEntrySummarySchema = z.object({
  visitRequestId: z.uuid(),
  status: z.enum(VISIT_REQUEST_STATUSES),
  organization: z.string(),
  contactPerson: z.string(),
  email: z.string(),
  phone: z.string(),
  purpose: z.string().nullable(),
  approvedSchedule: approvedScheduleSchema,
  visitorCount: z.number().int(),
  visitors: z.array(visitorSchema),
  vehicles: z.array(vehicleSchema),
  equipment: z.string().nullable(),
});

export type PreferredSchedule = z.infer<typeof preferredScheduleSchema>;
export type ApprovedSchedule = z.infer<typeof approvedScheduleSchema>;
export type VisitRequest = z.infer<typeof visitRequestSchema>;
export type CampusEntrySummary = z.infer<typeof campusEntrySummarySchema>;

export type VisitRequestListQuery = {
  status?: VisitRequestStatus;
  search?: string;
  /** YYYY-MM-DD, submission date in museum time, inclusive. */
  submittedFrom?: string;
  submittedTo?: string;
  /** YYYY-MM-DD: the approved date, or any preferred date while none is approved, inclusive. */
  visitDateFrom?: string;
  visitDateTo?: string;
};
