import { describe, expect, it } from "vitest";
import { communicationHistorySchema, entryTypeLabel, isInboundReply, isOutboundEmail, latestEmail } from "./history";

const curatorNote = {
  id: "11111111-1111-4111-8111-111111111111",
  direction: "INTERNAL",
  type: "NOTE",
  subject: null,
  message: "Called the school about parking.",
  recipientEmail: null,
  deliveryResult: null,
  sentAt: null,
  recordedBy: "22222222-2222-4222-8222-222222222222",
  createdAt: "2026-11-10T02:00:00.000Z",
};

const outboundEmail = {
  ...curatorNote,
  id: "33333333-3333-4333-8333-333333333333",
  direction: "OUTBOUND",
  type: "MESSAGE_EMAIL",
  subject: "Your visit request (Ref 33333333)",
  message: "Could you confirm the number of students?",
  recipientEmail: "visitor@example.test",
  deliveryResult: "SENT <synthetic@example.test>",
  sentAt: "2026-11-10T03:00:00.000Z",
};

// An imported reply (backend spec 0002 AC-4): no acting curator, received time in sentAt.
const visitorReply = {
  ...curatorNote,
  id: "44444444-4444-4444-8444-444444444444",
  direction: "INBOUND",
  type: "VISITOR_REPLY",
  subject: "Re: Your visit request (Ref 33333333)",
  message: "There will be 32 students and 3 teachers.",
  recipientEmail: null,
  sentAt: "2026-11-10T05:12:00.000Z",
  recordedBy: null,
  createdAt: "2026-11-10T05:14:00.000Z",
};

describe("communication history with visitor replies", () => {
  it("parses a history that includes an imported reply with no curator", () => {
    const history = communicationHistorySchema.parse([curatorNote, outboundEmail, visitorReply]);
    expect(history).toHaveLength(3);
    expect(history[2].recordedBy).toBeNull();
  });

  it("still requires recordedBy to be present, even if null", () => {
    const { recordedBy, ...withoutCurator } = visitorReply;
    void recordedBy;
    expect(communicationHistorySchema.safeParse([withoutCurator]).success).toBe(false);
  });

  it("tells replies apart from emails BioSphere sent", () => {
    const [note, email, reply] = communicationHistorySchema.parse([curatorNote, outboundEmail, visitorReply]);
    expect(isInboundReply(reply)).toBe(true);
    expect(isOutboundEmail(reply)).toBe(false);
    expect(isInboundReply(email)).toBe(false);
    expect(isInboundReply(note)).toBe(false);
    // The decision email check reads the newest email BioSphere sent, never a reply.
    expect(latestEmail([note, email, reply])?.id).toBe(email.id);
  });

  it("labels a reply for curators", () => {
    expect(entryTypeLabel("VISITOR_REPLY")).toBe("Visitor reply");
  });
});
