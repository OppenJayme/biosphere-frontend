/** Server-only client for the curator General Inquiry endpoints (SRS 4.8). */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { communicationEntrySchema, communicationHistorySchema } from "../public-submissions/history";
import { parseResponse as parse } from "../public-submissions/parse";
import {
  inquiryListSchema,
  inquiryReferralResultSchema,
  inquirySchema,
  type Inquiry,
  type InquiryListQuery,
  type InquiryReferralInput,
} from "./types";
import type { CuratorSettableInquiryStatus } from "./workflow";

const path = (id: string, suffix = "") => `/inquiries/${encodeURIComponent(id)}${suffix}`;

export async function listInquiries(query: InquiryListQuery = {}): Promise<Inquiry[]> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  if (query.submittedFrom) params.set("submittedFrom", query.submittedFrom);
  if (query.submittedTo) params.set("submittedTo", query.submittedTo);
  const serialized = params.toString();

  const response = await apiFetch<unknown>(serialized ? `/inquiries?${serialized}` : "/inquiries", {
    method: "GET",
    cache: "no-store",
  });
  return parse(inquiryListSchema, response, "inquiry list");
}

export async function getInquiry(id: string) {
  const response = await apiFetch<unknown>(path(id), { method: "GET", cache: "no-store" });
  return parse(inquirySchema, response, "inquiry");
}

export async function getInquiryHistory(id: string) {
  const response = await apiFetch<unknown>(path(id, "/history"), { method: "GET", cache: "no-store" });
  return parse(communicationHistorySchema, response, "inquiry history");
}

export async function updateInquiryStatus(id: string, input: { status: CuratorSettableInquiryStatus; note?: string }) {
  const response = await apiFetch<unknown>(path(id), { method: "PATCH", body: JSON.stringify(input) });
  return parse(inquirySchema, response, "updated inquiry");
}

export async function referInquiry(id: string, input: InquiryReferralInput) {
  const response = await apiFetch<unknown>(path(id, "/referral"), { method: "POST", body: JSON.stringify(input) });
  return parse(inquiryReferralResultSchema, response, "inquiry referral");
}

/** Emails the visitor a curator-written reply (REQ-4.8-09). The status does not change. */
export async function sendInquiryReply(id: string, input: { subject?: string; message: string }) {
  const response = await apiFetch<unknown>(path(id, "/replies"), { method: "POST", body: JSON.stringify(input) });
  return parse(communicationEntrySchema, response, "inquiry reply");
}

export async function addInquiryNote(id: string, message: string) {
  const response = await apiFetch<unknown>(path(id, "/notes"), {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return parse(communicationEntrySchema, response, "inquiry note");
}
