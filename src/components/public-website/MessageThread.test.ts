import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// DetailParts also holds the "Check for replies" form, whose server action is not under test here.
vi.mock("@/features/mailbox-sync/actions", () => ({ checkVisitorRepliesAction: vi.fn() }));

import type { CommunicationEntry } from "@/features/public-submissions/history";
import { MessageThread, MessagesJumpLink, messageCount } from "./DetailParts";

const curatorId = "22222222-2222-4222-8222-222222222222";

const note: CommunicationEntry = {
  id: "11111111-1111-4111-8111-111111111111",
  direction: "INTERNAL",
  type: "NOTE",
  subject: null,
  message: "Called the school about parking.",
  recipientEmail: null,
  deliveryResult: null,
  sentAt: null,
  recordedBy: curatorId,
  createdAt: "2026-11-10T02:00:00.000Z",
};

const sentEmail: CommunicationEntry = {
  ...note,
  id: "33333333-3333-4333-8333-333333333333",
  direction: "OUTBOUND",
  type: "MESSAGE_EMAIL",
  subject: "About your inquiry",
  message: "We open at 8:00 AM on weekdays.",
  recipientEmail: "visitor@example.test",
  deliveryResult: "SENT <synthetic@example.test> · delivered",
  sentAt: "2026-11-10T03:00:00.000Z",
};

const failedEmail: CommunicationEntry = {
  ...sentEmail,
  id: "55555555-5555-4555-8555-555555555555",
  message: "Second try.",
  deliveryResult: "FAILED 401 Key not found",
};

const reply: CommunicationEntry = {
  ...note,
  id: "44444444-4444-4444-8444-444444444444",
  direction: "INBOUND",
  type: "VISITOR_REPLY",
  subject: "Re: About your inquiry",
  message: "Thank you! We will come on Tuesday.",
  recordedBy: null,
  sentAt: "2026-11-10T05:12:00.000Z",
  createdAt: "2026-11-10T05:14:00.000Z",
};

const visitorMessage = {
  label: "Inquiry message",
  text: "What are your opening hours?",
  receivedAt: "2026-11-10T01:00:00.000Z",
};

function render(entries: CommunicationEntry[] | null, message: typeof visitorMessage | null = visitorMessage) {
  return renderToStaticMarkup(
    createElement(MessageThread, { id: "inquiry-messages", visitorMessage: message, entries, currentAccountId: curatorId }),
  );
}

// Curator UAT 2026-11-14: the visitor's message and the emails were hard to find in the history.
describe("MessageThread", () => {
  it("shows the visitor's message and every email in full, oldest first, without notes", () => {
    const html = render([note, sentEmail, reply]);
    expect(html).toContain('id="inquiry-messages"');
    const order = [visitorMessage.text, sentEmail.message, reply.message].map((text) => html.indexOf(text));
    expect(order.every((index) => index > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).not.toContain(note.message);
    // Full text, not collapsed behind "Show email" as in the history.
    expect(html).not.toContain("<details");
  });

  it("lets keyboard users reach and scroll each message body", () => {
    const html = render([sentEmail, reply]);
    expect(html.match(/role="region"/g)).toHaveLength(3);
    expect(html.match(/tabindex="0"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Inquiry message"');
    expect(html).toContain('aria-label="Visitor reply, ');
  });

  it("says who each email is from and how it was delivered", () => {
    const html = render([sentEmail, failedEmail, reply]);
    expect(html).toContain("To visitor@example.test · You");
    expect(html).toContain("Delivered");
    expect(html).toContain("Email failed");
    expect(html).toContain("The visitor did not receive this (401 Key not found)");
    expect(html).toContain("From the visitor · received");
  });

  it("explains an empty thread and a failed load", () => {
    expect(render([note], null)).toContain("No emails yet.");
    const failed = render(null);
    expect(failed).toContain("Emails could not be loaded.");
    expect(failed).toContain(visitorMessage.text);
  });
});

describe("Messages jump link", () => {
  it("counts the visitor's message plus emails, not notes", () => {
    expect(messageCount(visitorMessage, [note, sentEmail, reply])).toBe(3);
    expect(messageCount(null, [note])).toBe(0);
    expect(messageCount(visitorMessage, null)).toBe(1);
  });

  it("links to the panel", () => {
    const html = renderToStaticMarkup(createElement(MessagesJumpLink, { targetId: "visit-messages", count: 2 }));
    expect(html).toContain('href="#visit-messages"');
    expect(html).toContain("Messages (2)");
  });
});
