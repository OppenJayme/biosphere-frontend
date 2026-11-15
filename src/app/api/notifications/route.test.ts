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

describe("bulk notification state route", () => {
  const ids = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
  ];
  function feed(read: (string | null)[], total = read.length) {
    return Response.json({
      stateManagementEnabled: true,
      unreadTotal: read.filter((value) => value === null).length,
      total,
      pendingInquiries: 0,
      pendingVisitRequests: 0,
      emailFailures: 0,
      items: read.map((readAt, index) => ({
        id: `NEW_INQUIRY:${ids[index]}`,
        type: "NEW_INQUIRY",
        title: "New general inquiry",
        recordType: "inquiry",
        recordId: ids[index],
        referenceCode: "A1B2C3D4",
        createdAt: "2026-11-14T15:18:00.000Z",
        readAt,
      })),
    });
  }
  const updates = () =>
    fetcher.mock.calls
      .filter(([url]) => String(url).endsWith("/notifications/state"))
      .map(([, init]) => JSON.parse(String(init?.body)));

  it("marks only the unread notifications the backend listed as read", async () => {
    fetcher.mockImplementation(async (url) =>
      String(url).includes("/notifications/state")
        ? Response.json({ updated: true })
        : feed([null, "2026-11-14T16:00:00.000Z", null]),
    );
    const response = await patch(request({ all: "READ" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: true, count: 2, failed: 0 });
    expect(updates()).toEqual([
      { notificationId: `NEW_INQUIRY:${ids[0]}`, state: "READ" },
      { notificationId: `NEW_INQUIRY:${ids[2]}`, state: "READ" },
    ]);
    expect(String(fetcher.mock.calls[0][0])).toContain("/notifications?limit=100");
  });

  it("clears every listed notification and reports a partial failure instead of success", async () => {
    let call = 0;
    fetcher.mockImplementation(async (url) => {
      if (!String(url).includes("/notifications/state")) return feed([null, null, null]);
      call += 1;
      return call === 2 ? Response.json({ message: "nope" }, { status: 500 }) : Response.json({ updated: true });
    });
    const response = await patch(request({ all: "DISMISSED" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ updated: false, count: 2, failed: 1 });
    expect(updates()).toHaveLength(3);
  });

  it("rejects an unknown bulk state before any session or backend access", async () => {
    expect((await patch(request({ all: "DELETED" }))).status).toBe(400);
    expect((await patch(request({ all: "READ", userAccountId: "other" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    expect(getAccessToken).not.toHaveBeenCalled();
  });
});
