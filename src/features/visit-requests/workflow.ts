/** Curator-facing labels and the visit-request status transitions the backend allows (SRS B.3). */

import type { VisitRequest, VisitRequestStatus } from "./types";
import { museumToday } from "../public-submissions/schedule";

export const VISIT_REQUEST_STATUS_LABELS: Record<VisitRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED_BY_CURATOR: "Approved by Curator",
  SUBMITTED_FOR_CAMPUS_ENTRY: "Submitted for Campus Entry",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

/** Statuses a curator can set with PATCH. APPROVED_BY_CURATOR is set only by approving a schedule. */
export type CuratorSettableVisitStatus = "SUBMITTED_FOR_CAMPUS_ENTRY" | "COMPLETED" | "DECLINED" | "CANCELLED";

const NEXT_STATUSES: Record<VisitRequestStatus, CuratorSettableVisitStatus[]> = {
  PENDING: ["DECLINED", "CANCELLED"],
  APPROVED_BY_CURATOR: ["SUBMITTED_FOR_CAMPUS_ENTRY", "DECLINED", "CANCELLED"],
  SUBMITTED_FOR_CAMPUS_ENTRY: ["COMPLETED"],
  DECLINED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export function nextVisitStatuses(status: VisitRequestStatus) {
  return NEXT_STATUSES[status];
}

export function canApproveSchedule(status: VisitRequestStatus) {
  return status === "PENDING";
}

export function isVisitFinal(status: VisitRequestStatus) {
  return status === "DECLINED" || status === "CANCELLED" || status === "COMPLETED";
}

/** Declining or cancelling ends the request for good, so the UI asks for confirmation first. */
export function isDestructiveVisitStatus(status: CuratorSettableVisitStatus) {
  return status === "DECLINED" || status === "CANCELLED";
}

/** Only a decline or cancellation emails the visitor; the backend ignores email fields otherwise. */
export function emailsVisitorOnStatus(status: CuratorSettableVisitStatus) {
  return status === "DECLINED" || status === "CANCELLED";
}

/** Approved visits whose date is today or later at the museum. */
export function isUpcomingVisit(request: VisitRequest, today = museumToday()) {
  return (
    (request.status === "APPROVED_BY_CURATOR" || request.status === "SUBMITTED_FOR_CAMPUS_ENTRY") &&
    request.approvedSchedule !== null &&
    request.approvedSchedule.date >= today
  );
}
