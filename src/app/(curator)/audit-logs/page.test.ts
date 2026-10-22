/** Isolated page loading + static UI output, not Next RSC, hydration or live authorization. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// Keep external session/HTTP boundaries synthetic; run the real audit client and UI.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://audit.test" } }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue("synthetic-test-token"),
}));

import AuditLogsPage from "./page";
import { verifySession } from "@/lib/session";
import type { AuditLogPage } from "@/features/audit/types";

const fetchMock = vi.fn<typeof fetch>();
const auditResponse: AuditLogPage = {
  items: [{
    id: "00000000-0000-4000-8000-000000000001",
    actor: null,
    affectedRecordId: "00000000-0000-4000-8000-000000000002",
    affectedRecordType: "specimen",
    action: "TEST_AUDIT_RECOVERY",
    module: "specimens",
    details: { note: "Synthetic recovery detail" },
    result: "SUCCESS",
    createdAt: "2026-10-22T00:00:00.000Z",
  }],
  total: 1,
  page: 1,
  limit: 25,
};

async function renderPage() {
  // Await the page explicitly: Vitest is not acting as an async RSC renderer.
  return renderToStaticMarkup(await AuditLogsPage({ searchParams: Promise.resolve({}) }));
}

function expectUnavailable(html: string) {
  expect(html).toContain("Audit history could not be loaded.");
  expect(html).not.toContain("<table");
  expect(html).not.toContain("Selected log");
  expect(html).not.toContain("Matching logs");
  expect(html).not.toContain("No audit entries match these filters.");
}

describe("Audit page failure and recovery output", () => {
  beforeEach(() => {
    vi.mocked(verifySession).mockResolvedValue({
      id: "synthetic-user",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-10-22T00:00:00.000Z",
    });
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("shows a safe unavailable state for a connection failure, not empty or fabricated audit data", async () => {
    fetchMock.mockRejectedValueOnce(new Error("PRIVATE_DRIVER_DETAIL"));
    const html = await renderPage();
    expectUnavailable(html);
    expect(html).toContain("Check the backend connection and try again. No sample audit events are shown.");
    expect(html).not.toContain("PRIVATE_DRIVER_DETAIL");
    expect(html).toContain("Apply filters");
  });

  it.each([500, 502, 503])("does not reveal an HTTP %s error body as audit content", async (status) => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "PRIVATE_ERROR_BODY" }, { status }));
    const html = await renderPage();
    expectUnavailable(html);
    expect(html).toContain("Check the backend connection and try again.");
    expect(html).not.toContain("PRIVATE_ERROR_BODY");
  });

  it("shows permission guidance without audit data or the backend error body for HTTP 403", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "PRIVATE_PERMISSION_DETAIL" }, { status: 403 }));
    const html = await renderPage();
    expectUnavailable(html);
    expect(html).toContain("Your active account does not have permission to review audit history.");
    expect(html).not.toContain("Check the backend connection");
    expect(html).not.toContain("PRIVATE_PERMISSION_DETAIL");
  });

  it("redirects to login rather than rendering audit data when the backend returns HTTP 401", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: "PRIVATE_SESSION_DETAIL" }, { status: 401 }));
    await expect(renderPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/login?from=/audit-logs;307;",
    });
  });

  it("rejects an invalid successful payload instead of displaying its unvalidated entries", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({
      ...auditResponse,
      items: [{ ...auditResponse.items[0], result: "UNRECOGNIZED", details: "PRIVATE_INVALID_PAYLOAD" }],
    }));
    const html = await renderPage();
    expectUnavailable(html);
    expect(html).not.toContain("TEST_AUDIT_RECOVERY");
    expect(html).not.toContain("PRIVATE_INVALID_PAYLOAD");
  });

  it("handles non-JSON upstream content without reflecting it into the page", async () => {
    fetchMock.mockResolvedValueOnce(new Response("<html>PRIVATE_UPSTREAM_CONTENT</html>"));
    const html = await renderPage();
    expectUnavailable(html);
    expect(html).not.toContain("PRIVATE_UPSTREAM_CONTENT");
  });

  it("removes prior audit output on a failed request and restores it on a later successful request", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(auditResponse));
    const initial = await renderPage();
    expect(initial).toContain("<table");
    expect(initial).toContain("TEST_AUDIT_RECOVERY");
    expect(initial).toContain("Selected log");

    fetchMock.mockRejectedValueOnce(new Error("Synthetic outage"));
    const failed = await renderPage();
    expectUnavailable(failed);
    expect(failed).not.toContain("TEST_AUDIT_RECOVERY");
    expect(failed).not.toContain("Synthetic recovery detail");

    fetchMock.mockResolvedValueOnce(Response.json(auditResponse));
    const recovered = await renderPage();
    expect(recovered).toContain("<table");
    expect(recovered).toContain("TEST_AUDIT_RECOVERY");
    expect(recovered).toContain("Synthetic recovery detail");
    expect(recovered).toContain("Selected log");
    expect(recovered).not.toContain("Audit history could not be loaded.");
  });
});
