import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://faq.test" } }));
vi.mock("@/lib/session", () => ({ verifySession: vi.fn().mockResolvedValue({ id: "synthetic-curator" }), getAccessToken: vi.fn().mockResolvedValue("synthetic-token") }));
import { changeReviewQuestion } from "./review-actions";
import { verifySession } from "@/lib/session";
afterEach(() => { vi.unstubAllGlobals(); vi.mocked(verifySession).mockResolvedValue({ id: "synthetic-curator" } as Awaited<ReturnType<typeof verifySession>>); });
it("requires a session before attempting a protected disposition", async () => {
  vi.mocked(verifySession).mockResolvedValueOnce(null);
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  expect(await changeReviewQuestion("11111111-1111-4111-8111-111111111111", "REVIEWED")).toMatchObject({ ok: false, message: expect.stringContaining("Sign in") });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each(["REVIEWED", "DISMISSED", "REMOVE"])("sends only validated identifier and %s command", async command => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(command === "REMOVE" ? { removed: true } : { updated: true }));
  vi.stubGlobal("fetch", fetchMock);
  expect(await changeReviewQuestion("11111111-1111-4111-8111-111111111111", command)).toEqual({ ok: true });
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/faq/review-queue/11111111-1111-4111-8111-111111111111");
  expect(init.method).toBe(command === "REMOVE" ? "DELETE" : "PATCH");
  expect(init.body).toBe(command === "REMOVE" ? undefined : JSON.stringify({ status: command }));
});
it.each([401, 403, 404, 503])("returns safe feedback for protected HTTP %s failure", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "PRIVATE" }, { status })));
  const result = await changeReviewQuestion("11111111-1111-4111-8111-111111111111", "REVIEWED");
  expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("rejects invalid commands without a backend mutation", async () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  expect(await changeReviewQuestion("bad", "REMOVE")).toMatchObject({ ok: false });
  expect(await changeReviewQuestion("11111111-1111-4111-8111-111111111111", "PUBLISH")).toMatchObject({ ok: false });
  expect(fetchMock).not.toHaveBeenCalled();
});
