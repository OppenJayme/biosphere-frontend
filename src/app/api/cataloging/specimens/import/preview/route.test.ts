/** Real Request/Response handler + API client; only auth/config/remote HTTP are synthetic. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken, verifySession } = vi.hoisted(() => ({ getAccessToken: vi.fn(), verifySession: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAccessToken, verifySession }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://import-adapter.test" } }));
const fetcher = vi.fn<typeof fetch>();
let post: typeof import("./route").POST;
const preview = {
  previewId: "10000000-0000-4000-8000-000000000001",
  expiresAt: "2026-10-29T14:00:00Z",
  rows: [{ rowNumber: 1, data: { commonName: "Synthetic import" }, valid: true, errors: [], duplicateWarnings: [], fieldWarnings: [], archivedInSource: false, lotsToImport: 0, lotsSkipped: 0 }],
  totalRows: 1, validRows: 1, invalidRows: 0, rowsWithWarnings: 0, unmappedColumns: [],
  rowsWithFieldWarnings: 0, archivedRows: 0, lotSheet: null, restoreNotice: null, lotsToImport: 0, lotsSkipped: 0,
};
function request(name = "specimens.xlsx") {
  const body = new FormData();
  body.set("file", new File(["synthetic-workbook-bytes"], name));
  return new Request("http://import-adapter.test/api/cataloging/specimens/import/preview", { method: "POST", body });
}
beforeAll(async () => {
  vi.stubEnv("API_URL", "http://import-adapter.test");
  ({ POST: post } = await import("./route"));
});
beforeEach(() => {
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  verifySession.mockReset().mockResolvedValue({ role: "CURATOR" });
  getAccessToken.mockReset().mockResolvedValue("synthetic-import-token");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe("Excel preview request boundary", () => {
  it.each(["specimens.xlsx", "specimens.XLSX"])("forwards %s bytes once and returns the validated uncached preview", async (name) => {
    fetcher.mockResolvedValueOnce(Response.json(preview));
    const response = await post(request(name));
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(preview);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("http://import-adapter.test/specimens/import/preview");
    const forwarded = (init?.body as FormData).get("file") as File;
    expect(forwarded.name).toBe(name);
    expect(await forwarded.text()).toBe("synthetic-workbook-bytes");
  });
  it("rejects legacy XLS without forwarding", async () => {
    expect((await post(request("specimens.xls"))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("requires a session before forwarding XLSX", async () => {
    verifySession.mockResolvedValueOnce(null);
    expect((await post(request())).status).toBe(401);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("preserves a backend workbook rejection for the curator", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ message: "Use a worksheet named Specimens." }, { status: 400 }));
    const response = await post(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Use a worksheet named Specimens." });
  });
  it("rejects malformed success without reporting a ready preview", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ success: true }));
    const response = await post(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: "The import preview is temporarily unavailable." });
  });
});
