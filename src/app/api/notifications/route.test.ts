import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAccessToken }));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://notifications-backend.test" },
}));
const fetcher = vi.fn<typeof fetch>();
let patch: typeof import("./route").PATCH;
const payload = {
  notificationId: "NEW_INQUIRY:55555555-5555-4555-8555-555555555555",
  state: "READ",
};
function request(
  body: unknown = payload,
  headers: Record<string, string> = {},
) {
  return new Request("http://notifications-frontend.test/api/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://notifications-frontend.test",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
beforeAll(async () => {
  vi.stubEnv("API_URL", "http://notifications-backend.test");
  ({ PATCH: patch } = await import("./route"));
});
beforeEach(() => {
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  getAccessToken.mockReset().mockResolvedValue("synthetic-notification-token");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());
describe("notification state route boundary", () => {
  it("forwards a valid authenticated state change once and returns an uncached validated acknowledgement", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ updated: true }));
    const response = await patch(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("http://notifications-backend.test/notifications/state");
    expect(JSON.parse(String(init?.body))).toEqual(payload);
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer synthetic-notification-token",
    );
  });
  it("rejects cross-site and injected recipient requests before any session/backend access", async () => {
    expect(
      (await patch(request(payload, { "Sec-Fetch-Site": "cross-site" })))
        .status,
    ).toBe(403);
    expect(
      (
        await patch(
          request(payload, { Origin: "http://different-origin.test" }),
        )
      ).status,
    ).toBe(403);
    expect(
      (await patch(request({ ...payload, userAccountId: "other" }))).status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    expect(getAccessToken).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404, 503])(
    "preserves safe handling of backend %i without relaying internal details",
    async (status) => {
      fetcher.mockResolvedValueOnce(
        Response.json({ message: "INTERNAL_SYNTHETIC_MARKER" }, { status }),
      );
      const response = await patch(request());
      expect(response.status).toBe(status < 500 ? status : 502);
      expect(JSON.stringify(await response.json())).not.toContain(
        "INTERNAL_SYNTHETIC_MARKER",
      );
    },
  );
  it("treats a malformed successful acknowledgement as unknown rather than confirmed", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ updated: false }));
    expect((await patch(request())).status).toBe(502);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
