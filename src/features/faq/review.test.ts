import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://faq.test" } }));
import { fetchReviewPolicy, submitReviewQuestion } from "./review";
afterEach(() => vi.unstubAllGlobals());
it("sends only explicitly approved question and retry token without cookies or referrer", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ accepted: true }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await submitReviewQuestion("Weekend workshops?", "11111111-1111-4111-8111-111111111111")).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith("http://faq.test/faq/assistant/review-submissions", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "Weekend workshops?", submissionId: "11111111-1111-4111-8111-111111111111", consent: true }),
    credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
  });
});
it("fails closed when policy is disabled, unavailable or malformed", async () => {
  for (const body of [{ enabled: false, retentionDays: 30 }, { enabled: true, retentionDays: 90 }]) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    expect((await fetchReviewPolicy())?.enabled ?? false).toBe(false);
  }
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("PRIVATE")));
  expect(await fetchReviewPolicy()).toBeNull();
});
it.each([429, 503, 500])("does not claim submission success or display an HTTP %s body", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ accepted: true, message: "PRIVATE" }, { status })));
  const result = await submitReviewQuestion("Question?", "11111111-1111-4111-8111-111111111111");
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("retains caller retry identity after an unknown transport outcome and rejects malformed success", async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error("PRIVATE")).mockResolvedValueOnce(Response.json({ accepted: true })).mockResolvedValueOnce(Response.json({ accepted: false }));
  vi.stubGlobal("fetch", fetchMock);
  const id = "11111111-1111-4111-8111-111111111111";
  expect(await submitReviewQuestion("Question?", id)).toMatchObject({ ok: false, message: expect.stringContaining("could not be confirmed") });
  expect(await submitReviewQuestion("Question?", id)).toEqual({ ok: true });
  expect(fetchMock.mock.calls[0]).toEqual(fetchMock.mock.calls[1]);
  expect(await submitReviewQuestion("Question?", id)).toMatchObject({ ok: false });
});
