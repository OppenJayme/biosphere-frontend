/** Curator-facing labels and the inquiry status transitions the backend allows (SRS B.3). */

import type { InquiryStatus } from "./types";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  TURNED_TO_VISIT_REQUEST: "Turned to Visit Request",
  CLOSED: "Closed",
};

/** Statuses a curator can set with PATCH. TURNED_TO_VISIT_REQUEST is set only by a referral. */
export type CuratorSettableInquiryStatus = "REVIEWED" | "CLOSED";

const NEXT_STATUSES: Record<InquiryStatus, CuratorSettableInquiryStatus[]> = {
  PENDING: ["REVIEWED"],
  REVIEWED: ["CLOSED"],
  TURNED_TO_VISIT_REQUEST: [],
  CLOSED: [],
};

export function nextInquiryStatuses(status: InquiryStatus) {
  return NEXT_STATUSES[status];
}

export function canReferInquiry(status: InquiryStatus) {
  return status === "PENDING" || status === "REVIEWED";
}

export function isInquiryFinal(status: InquiryStatus) {
  return status === "TURNED_TO_VISIT_REQUEST" || status === "CLOSED";
}

/** Categories the public form offers; the backend stores the value as free text and defaults to GENERAL. */
export const INQUIRY_TYPES = [
  { value: "GENERAL", label: "General question" },
  { value: "TOUR", label: "Tours and visits" },
  { value: "RESEARCH", label: "Research or specimen access" },
  { value: "DONATION", label: "Specimen donation" },
  { value: "MEDIA", label: "Media or publication" },
  { value: "OTHER", label: "Other" },
] as const;

export function inquiryTypeLabel(value: string) {
  return INQUIRY_TYPES.find((type) => type.value === value)?.label ?? value;
}
