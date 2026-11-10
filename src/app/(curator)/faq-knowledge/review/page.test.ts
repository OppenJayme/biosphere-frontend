import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://faq.test" } }));
vi.mock("@/lib/session", () => ({ verifySession: vi.fn().mockResolvedValue({ id: "synthetic-curator" }), getAccessToken: vi.fn().mockResolvedValue("synthetic-token") }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import Page from "./page";
afterEach(() => vi.unstubAllGlobals());
it("renders synthetic curator feedback as escaped text, with dispositions and no publish shortcut", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ page: 1, hasMore: false, items: [{
    id: "11111111-1111-4111-8111-111111111111", question: "<script>untrusted</script>", repeatCount: 2,
    status: "PENDING", firstSubmittedAt: "2026-10-25T00:00:00.000Z", lastSubmittedAt: "2026-10-25T00:00:00.000Z", expiresAt: "2026-11-24T00:00:00.000Z",
  }] })));
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("&lt;script&gt;untrusted&lt;/script&gt;");
  expect(html).toContain("Mark reviewed");
  expect(html).toContain("Dismiss");
  expect(html).toContain("Remove permanently");
  expect(html).toContain("not distinct visitors");
  expect(html).not.toContain("<script>untrusted");
  expect(html).not.toContain(">Publish<");
});
it.each([403, 503])("does not render protected or fabricated queue data for HTTP %s", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "PRIVATE", items: [{ question: "PRIVATE" }] }, { status })));
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('role="alert"');
  expect(html).not.toContain("PRIVATE");
  expect(html).not.toContain("Mark reviewed");
  expect(html).not.toContain("No unexpired review items");
});
it("redirects an expired session instead of rendering queue text", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status: 401 })));
  await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/login?from=/faq-knowledge/review;307;" });
});
