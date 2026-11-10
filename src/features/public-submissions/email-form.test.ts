import { describe, expect, it } from "vitest";
import { curatorActionError } from "./errors";
import { emailOutcome, readDecisionEmail, readVisitorEmail } from "./email-form";
import { deliveryReason, deliveryStatus, latestEmail, type CommunicationEntry } from "./history";

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

function entry(overrides: Partial<CommunicationEntry>): CommunicationEntry {
  return {
    id: crypto.randomUUID(),
    direction: "INTERNAL",
    type: "NOTE",
    subject: null,
    message: "",
    recipientEmail: null,
    deliveryResult: null,
    sentAt: null,
    recordedBy: "curator",
    createdAt: "2026-09-29T00:00:00Z",
    ...overrides,
  };
}

describe("readDecisionEmail", () => {
  it("treats an unticked box as 'don't email' and drops the visitor message", () => {
    expect(readDecisionEmail(formData({ visitorMessage: "See you soon" }))).toMatchObject({
      notifyVisitor: false,
      visitorMessage: undefined,
      rawMessage: "See you soon",
    });
  });

  it("sends a trimmed message only when notifying, and omits a blank one", () => {
    expect(readDecisionEmail(formData({ notifyVisitor: "on", visitorMessage: "  See you soon " }))).toMatchObject({
      notifyVisitor: true,
      visitorMessage: "See you soon",
    });
    expect(readDecisionEmail(formData({ notifyVisitor: "on", visitorMessage: "  " })).visitorMessage).toBeUndefined();
  });

  it("rejects messages over 5,000 characters", () => {
    expect(readDecisionEmail(formData({ notifyVisitor: "on", visitorMessage: "x".repeat(5001) })).error).toMatch(/5,000/);
  });
});

describe("readVisitorEmail", () => {
  it("requires a message, omits a blank subject, and echoes what was typed", () => {
    const blank = readVisitorEmail(formData({ subject: "Hi", body: "   " }));
    expect(blank.success).toBe(false);
    expect(blank.values).toEqual({ subject: "Hi", body: "   " });

    const ok = readVisitorEmail(formData({ subject: " ", body: " Please send the student list. " }));
    expect(ok.success && ok.data).toEqual({ subject: undefined, message: "Please send the student list." });
  });

  it("caps the subject at 150 characters", () => {
    expect(readVisitorEmail(formData({ subject: "s".repeat(151), body: "Hi" })).success).toBe(false);
  });
});

describe("delivery results", () => {
  it("classifies the backend's delivery text", () => {
    expect(deliveryStatus("SENT <abc@smtp-relay>")).toBe("sent");
    expect(deliveryStatus("FAILED 401 Key not found")).toBe("failed");
    expect(deliveryStatus("NOT_SENT email not configured")).toBe("not-sent");
    expect(deliveryStatus(null)).toBeNull();
    expect(deliveryReason("FAILED 401 Key not found")).toBe("401 Key not found");
  });

  it("reports the newest outbound email, ignoring internal entries", () => {
    const history = [
      entry({ direction: "OUTBOUND", type: "MESSAGE_EMAIL", deliveryResult: "SENT <1>" }),
      entry({ type: "STATUS_CHANGE" }),
      entry({ direction: "OUTBOUND", type: "STATUS_UPDATE_EMAIL", deliveryResult: "FAILED timeout" }),
      entry({ type: "NOTE" }),
    ];
    expect(emailOutcome(latestEmail(history))).toBe("failed");
    expect(emailOutcome(latestEmail([entry({})]))).toBeUndefined();
  });

  it("never invites a blind resend when a send can't be confirmed", () => {
    expect(curatorActionError(null, "inquiry-reply")).toMatch(/check the history before sending it again/);
    expect(curatorActionError({ status: 500, body: null }, "visit-message")).toMatch(/couldn't confirm/);
  });
});
