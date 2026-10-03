import { z } from "zod";
import type { ScheduleInput } from "../public-submissions/schedule";

// Mirrors the backend general_inquiry_status enum (SRS REQ-4.8-06).
export const INQUIRY_STATUSES = ["PENDING", "REVIEWED", "TURNED_TO_VISIT_REQUEST", "CLOSED"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

// Curator-only view of a stored inquiry. Nullable columns come back as null, not omitted.
export const inquirySchema = z.object({
  id: z.uuid(),
  referenceCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string(),
  phone: z.string().nullable(),
  organization: z.string().nullable(),
  inquiryType: z.string(),
  message: z.string(),
  status: z.enum(INQUIRY_STATUSES),
  consentAcceptedAt: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  visitRequestId: z.uuid().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const inquiryListSchema = z.array(inquirySchema);

export const inquiryReferralResultSchema = z.object({
  inquiry: inquirySchema,
  visitRequestId: z.uuid(),
});

export type Inquiry = z.infer<typeof inquirySchema>;

export type InquiryListQuery = {
  status?: InquiryStatus;
  search?: string;
  /** YYYY-MM-DD, submission date in museum time, inclusive. */
  submittedFrom?: string;
  submittedTo?: string;
};

export type InquiryReferralInput = {
  phone?: string;
  organization?: string;
  purpose?: string;
  visitorCount: number;
  preferredSchedules: ScheduleInput[];
  note?: string;
};
