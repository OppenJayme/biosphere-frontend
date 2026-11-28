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

/**
 * What the Change status dropdown offers. A curator can close a Pending inquiry directly (panel
 * feedback: closing took two separate changes), but the backend still requires Reviewed before
 * Closed (SRS B.3), so inquiryStatusSteps sends both and the history records the review.
 */
const NEXT_STATUSES: Record<InquiryStatus, CuratorSettableInquiryStatus[]> = {
  PENDING: ["REVIEWED", "CLOSED"],
  REVIEWED: ["CLOSED"],
  TURNED_TO_VISIT_REQUEST: [],
  CLOSED: [],
};

export function nextInquiryStatuses(status: InquiryStatus) {
  return NEXT_STATUSES[status];
}

/**
 * The backend status changes, in order, that move an inquiry from `from` to `to`. Closing a
 * Pending inquiry is two: Reviewed, then Closed. Returns null when `to` is not offered from `from`.
 */
export function inquiryStatusSteps(
  from: InquiryStatus,
  to: CuratorSettableInquiryStatus,
): CuratorSettableInquiryStatus[] | null {
  if (!NEXT_STATUSES[from].includes(to)) return null;
  return from === "PENDING" && to === "CLOSED" ? ["REVIEWED", "CLOSED"] : [to];
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
  { value: "VISIT_FOLLOW_UP", label: "Follow up, change, or cancel a visit request" },
  { value: "RESEARCH", label: "Research or specimen access" },
  { value: "DONATION", label: "Specimen donation" },
  { value: "MEDIA", label: "Media or publication" },
  { value: "OTHER", label: "Other" },
] as const;

/** The topic that asks for the visit request's reference number. */
export const VISIT_FOLLOW_UP_TYPE = "VISIT_FOLLOW_UP";

export function inquiryTypeLabel(value: string) {
  return INQUIRY_TYPES.find((type) => type.value === value)?.label ?? value;
}
