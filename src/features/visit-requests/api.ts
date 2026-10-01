/** Server-only client for the curator Visit Request endpoints (SRS 4.9). */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { communicationEntrySchema, communicationHistorySchema } from "../public-submissions/history";
import { parseResponse as parse } from "../public-submissions/parse";
import {
  campusEntrySummarySchema,
  visitRequestListSchema,
  visitRequestSchema,
  type VisitRequest,
  type VisitRequestListQuery,
} from "./types";
import type { CuratorSettableVisitStatus } from "./workflow";

const path = (id: string, suffix = "") => `/visit-requests/${encodeURIComponent(id)}${suffix}`;

export async function listVisitRequests(query: VisitRequestListQuery = {}): Promise<VisitRequest[]> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.submittedFrom) params.set("submittedFrom", query.submittedFrom);
  if (query.submittedTo) params.set("submittedTo", query.submittedTo);
  if (query.visitDateFrom) params.set("visitDateFrom", query.visitDateFrom);
  if (query.visitDateTo) params.set("visitDateTo", query.visitDateTo);
  const serialized = params.toString();

  const response = await apiFetch<unknown>(serialized ? `/visit-requests?${serialized}` : "/visit-requests", {
    method: "GET",
    cache: "no-store",
  });
  return parse(visitRequestListSchema, response, "visit request list");
}

export async function getVisitRequest(id: string) {
  const response = await apiFetch<unknown>(path(id), { method: "GET", cache: "no-store" });
  return parse(visitRequestSchema, response, "visit request");
}

export async function getVisitRequestHistory(id: string) {
  const response = await apiFetch<unknown>(path(id, "/history"), { method: "GET", cache: "no-store" });
  return parse(communicationHistorySchema, response, "visit request history");
}

export async function getCampusEntrySummary(id: string) {
  const response = await apiFetch<unknown>(path(id, "/campus-entry-summary"), { method: "GET", cache: "no-store" });
  return parse(campusEntrySummarySchema, response, "campus-entry summary");
}

/**
 * `note` stays internal. Declining or cancelling emails the visitor unless `notifyVisitor` is
 * false, with `visitorMessage` included; the backend ignores both for other statuses (REQ-4.9-11).
 */
export async function updateVisitRequestStatus(
  id: string,
  input: { status: CuratorSettableVisitStatus; note?: string; notifyVisitor?: boolean; visitorMessage?: string },
) {
  const response = await apiFetch<unknown>(path(id), { method: "PATCH", body: JSON.stringify(input) });
  return parse(visitRequestSchema, response, "updated visit request");
}

/** Approving emails the visitor the confirmed schedule unless `notifyVisitor` is false. */
export async function approveVisitSchedule(
  id: string,
  input: { preferenceOrder: number; note?: string; notifyVisitor?: boolean; visitorMessage?: string },
) {
  const response = await apiFetch<unknown>(path(id, "/approve-schedule"), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parse(visitRequestSchema, response, "approved visit request");
}

/** Emails the visitor a curator-written message, e.g. a request for more information (REQ-4.9-10). */
export async function sendVisitRequestMessage(id: string, input: { subject?: string; message: string }) {
  const response = await apiFetch<unknown>(path(id, "/messages"), { method: "POST", body: JSON.stringify(input) });
  return parse(communicationEntrySchema, response, "visit request message");
}

export async function addVisitRequestNote(id: string, message: string) {
  const response = await apiFetch<unknown>(path(id, "/notes"), {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return parse(communicationEntrySchema, response, "visit request note");
}
