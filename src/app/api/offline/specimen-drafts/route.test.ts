/** Native handler/API-client contract; only session/config and remote HTTP are synthetic. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAccessToken }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://offline-adapter.test" } }));

const fetcher = vi.fn<typeof fetch>();
let post: typeof import("./route").POST;

const payload = {
  clientDraftId: "10000000-0000-4000-8000-000000000001",
  draft: {
    collectionId: null,
    accessionNumber: "TEST-OFFLINE-ADAPTER",
    specimenCategory: "Testing",
    scientificName: "Testus adapterus",
    commonName: "TEST offline adapter",
    gender: "UNKNOWN",
    classificationStatus: null,
    remarks: "Synthetic handler fixture",
  },
};
const accepted = {
  clientDraftId: payload.clientDraftId,
  alreadySynchronized: false,
  specimen: {
    ...payload.draft,
    id: "20000000-0000-4000-8000-000000000001",
    status: "UNCATALOGED",
    publicDisplay: false,
    createdBy: "30000000-0000-4000-8000-000000000001",
    updatedBy: null,
    archivedBy: null,
    archivedAt: null,
    createdAt: "2026-10-28T00:00:00.000Z",
    updatedAt: "2026-10-28T00:00:00.000Z",
  },
};

function request(body: unknown = payload) {
  return new Request("http://offline-adapter.test/api/offline/specimen-drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  vi.stubEnv("API_URL", "http://offline-adapter.test");
  ({ POST: post } = await import("./route"));
});
beforeEach(() => {
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  getAccessToken.mockReset().mockResolvedValue("synthetic-offline-adapter-token");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe("offline draft route adapter", () => {
  it("forwards a valid draft once and returns the validated uncached success", async () => {
    fetcher.mockResolvedValueOnce(Response.json(accepted));

    const response = await post(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual(accepted);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("http://offline-adapter.test/offline-sync/specimen-drafts");
    expect(init).toMatchObject({ method: "POST", cache: "no-store" });
    expect(JSON.parse(String(init?.body))).toEqual(payload);
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer synthetic-offline-adapter-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it.each([
    { status: 401, message: "Synthetic expired session" },
    { status: 403, message: ["Synthetic permission denial"] },
  ])("preserves backend $status without caching or relaying unrelated fields", async ({ status, message }) => {
    fetcher.mockResolvedValueOnce(Response.json({ message, internalTrace: "synthetic-private-detail" }, { status }));

    const response = await post(request());

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ message });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns an uncached 502 when a backend 200 lacks a valid synchronized specimen", async () => {
    fetcher.mockResolvedValueOnce(Response.json({
      clientDraftId: payload.clientDraftId,
      alreadySynchronized: false,
      specimen: { id: accepted.specimen.id },
    }));

    const response = await post(request());

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ message: "The backend returned an invalid sync response." });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects unsupported publishing and quantity fields before contacting the backend", async () => {
    const response = await post(request({
      ...payload,
      draft: { ...payload.draft, publicDisplay: true, quantity: 5 },
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await response.json();
    expect(body.message).toEqual(expect.arrayContaining([
      expect.stringContaining("publicDisplay"),
      expect.stringContaining("quantity"),
    ]));
    expect(fetcher).not.toHaveBeenCalled();
    expect(getAccessToken).not.toHaveBeenCalled();
  });

  describe.each(["draft", "envelope"] as const)("unsupported fields in the %s", (placement) => {
    it.each([
      { field: "media", value: [{ filePath: "synthetic/not-an-upload.jpg" }] },
      { field: "taxonomy", value: { kingdom: "Animalia" } },
      { field: "provenance", value: { collectionDate: "2026-01-01" } },
      { field: "lots", value: [{ quantity: 1 }] },
      { field: "quantity", value: 5 },
      { field: "storageUnitId", value: "77777777-7777-4777-8777-777777777777" },
      { field: "movements", value: [{ reason: "Synthetic move request" }] },
      { field: "status", value: "ARCHIVED" },
      { field: "publicDisplay", value: true },
      { field: "qrCode", value: "synthetic-qr" },
      { field: "reportId", value: "88888888-8888-4888-8888-888888888888" },
      { field: "createdBy", value: "99999999-9999-4999-8999-999999999999" },
    ])("rejects $field before reading credentials or forwarding", async ({ field, value }) => {
      const body = placement === "draft"
        ? { ...payload, draft: { ...payload.draft, [field]: value } }
        : { ...payload, [field]: value };

      const response = await post(request(body));

      expect(response.status).toBe(400);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect((await response.json()).message).toEqual(expect.arrayContaining([
        expect.stringContaining(field),
      ]));
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(fetcher).not.toHaveBeenCalled();
    });
  });
});
