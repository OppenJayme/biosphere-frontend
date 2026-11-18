import { describe, expect, it } from "vitest";
import type { CuratorNotification } from "../notifications/types";
import type { CommunicationEntry } from "./history";
import { historySignature, replyEntryIdsFor } from "./reply-alerts";

const visitId = "11111111-1111-4111-8111-111111111111";
const inquiryId = "33333333-3333-4333-8333-333333333333";
const replyA = "22222222-2222-4222-8222-222222222222";
const replyB = "44444444-4444-4444-8444-444444444444";

function alert(overrides: Partial<CuratorNotification>): CuratorNotification {
  return {
    id: `VISITOR_REPLY:${replyA}`,
    type: "VISITOR_REPLY",
    title: "A visitor replied by email",
    recordType: "visit_request",
    recordId: visitId,
    referenceCode: "VR-0001",
    createdAt: "2026-11-16T10:26:02.000Z",
    readAt: null,
    ...overrides,
  } as CuratorNotification;
}

function entry(id: string): CommunicationEntry {
  return {
    id,
    direction: "INBOUND",
    type: "VISITOR_REPLY",
    subject: null,
    message: "Okay thanks",
    recipientEmail: null,
    deliveryResult: null,
    sentAt: null,
    recordedBy: null,
    createdAt: "2026-11-16T10:26:02.000Z",
  };
}

describe("replyEntryIdsFor", () => {
  it("returns the reply entry ids the bell lists for the open visit request", () => {
    const items = [alert({}), alert({ id: `VISITOR_REPLY:${replyB}` })];
    expect(replyEntryIdsFor(items, "visit", visitId)).toEqual([replyA, replyB]);
  });

  it("matches inquiries by their own record type", () => {
    const items = [alert({ recordType: "inquiry", recordId: inquiryId })];
    expect(replyEntryIdsFor(items, "inquiry", inquiryId)).toEqual([replyA]);
    expect(replyEntryIdsFor(items, "visit", inquiryId)).toEqual([]);
  });

  it("ignores other records and other alert types", () => {
    const items = [
      alert({ recordId: inquiryId }),
      alert({ id: `NEW_VISIT_REQUEST:${visitId}`, type: "NEW_VISIT_REQUEST" }),
    ];
    expect(replyEntryIdsFor(items, "visit", visitId)).toEqual([]);
  });

  it("returns nothing without a feed or an open record", () => {
    expect(replyEntryIdsFor(null, "visit", visitId)).toEqual([]);
    expect(replyEntryIdsFor([alert({})], null, null)).toEqual([]);
  });
});

describe("historySignature", () => {
  it("is equal for the same entries in a new array and changes when an entry is added", () => {
    const first = [entry(replyA)];
    expect(historySignature([...first])).toBe(historySignature(first));
    expect(historySignature([...first, entry(replyB)])).not.toBe(historySignature(first));
  });

  it("is empty for a missing history", () => {
    expect(historySignature(null)).toBe("");
  });
});
