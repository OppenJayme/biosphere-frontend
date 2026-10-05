import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://api.test" } }));

import {
  askFaqAssistant,
  faqAssistantFailure,
  fetchFaqSuggestions,
  normalizeVisitorQuestion,
} from "./assistant";

const ENTRY_ID = "11111111-1111-4111-8111-111111111111";
const NOTICE = "Answers are limited to curator-approved museum information.";

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FAQ assistant client", () => {
  it("sends only the question to the public ask endpoint and returns the approved answer", async () => {
    const fetchMock = mockFetch(
      json({
        outcome: "ANSWERED",
        answer: { id: ENTRY_ID, question: "When is the museum open?", answer: "9 to 4.", category: "Visit" },
        related: [],
        message: null,
        redirect: null,
        notice: NOTICE,
      }),
    );

    const result = await askFaqAssistant("When is the museum open?");

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/faq/assistant/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "When is the museum open?" }),
      cache: "no-store",
    });
    expect(result).toMatchObject({ ok: true, data: { outcome: "ANSWERED", answer: { answer: "9 to 4." } } });
  });

  it("keeps the fallback redirect for unmatched questions", async () => {
    mockFetch(
      json({
        outcome: "NO_MATCH",
        answer: null,
        related: [],
        message: "No approved answer is available.",
        redirect: "GENERAL_INQUIRY",
        notice: NOTICE,
      }),
    );

    const result = await askFaqAssistant("What species is this?");

    expect(result).toMatchObject({ ok: true, data: { outcome: "NO_MATCH", redirect: "GENERAL_INQUIRY" } });
  });

  it("refuses to show an unexpected response shape", async () => {
    mockFetch(json({ outcome: "ANSWERED", answer: "made-up text" }));

    expect(await askFaqAssistant("Hello")).toEqual({ ok: false, message: faqAssistantFailure(500) });
  });

  it("maps network, validation, and rate-limit failures to visitor messages", async () => {
    mockFetch(new TypeError("offline"));
    expect(await askFaqAssistant("Hello")).toEqual({ ok: false, message: faqAssistantFailure(null) });

    mockFetch(json({ message: ["question too long"] }, 400));
    expect(await askFaqAssistant("Hello")).toEqual({ ok: false, message: faqAssistantFailure(400) });

    mockFetch(json({ message: "Too Many Requests" }, 429));
    expect(await askFaqAssistant("Hello")).toEqual({ ok: false, message: faqAssistantFailure(429) });

    expect(faqAssistantFailure(null)).toMatch(/internet connection/);
  });

  it("loads bounded suggestions", async () => {
    const fetchMock = mockFetch(
      json({ items: [{ id: ENTRY_ID, question: "When is the museum open?", category: null }], notice: NOTICE }),
    );

    const result = await fetchFaqSuggestions();

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/faq/assistant/suggestions?limit=6", {
      cache: "no-store",
    });
    expect(result).toMatchObject({ ok: true, data: { items: [{ id: ENTRY_ID }] } });
  });

  it("normalizes visitor questions before sending", () => {
    expect(normalizeVisitorQuestion("  When   is it open?  ")).toBe("When is it open?");
    expect(normalizeVisitorQuestion("   ")).toBeNull();
    expect(normalizeVisitorQuestion("x".repeat(501))).toBeNull();
  });
});
