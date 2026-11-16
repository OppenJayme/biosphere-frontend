import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken } = vi.hoisted(() => ({ getAccessToken: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getAccessToken }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://push-backend.test" } }));

const fetcher = vi.fn<typeof fetch>();
let route: typeof import("./route");
const endpoint = "https://fcm.googleapis.com/fcm/send/device-1";

function request(method: "POST" | "DELETE", body: unknown = { endpoint }, headers: Record<string, string> = {}) {
  return new Request("http://push-frontend.test/api/push", {
    method,
    headers: { "Content-Type": "application/json", Origin: "http://push-frontend.test", ...headers },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  vi.stubEnv("API_URL", "http://push-backend.test");
  route = await import("./route");
});
beforeEach(() => {
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  getAccessToken.mockReset().mockResolvedValue("synthetic-push-token");
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.unstubAllEnvs());

describe("push route boundary", () => {
  it("registers this browser with the server-held session and only the endpoint", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ subscribed: true }));
    const response = await route.POST(request("POST"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscribed: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("http://push-backend.test/push/subscriptions");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ endpoint });
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer synthetic-push-token");
  });

  it("removes this browser", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ subscribed: false }));
    const response = await route.DELETE(request("DELETE"));
    expect(response.status).toBe(200);
    expect(fetcher.mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("rejects cross-site, injected account fields and non-https endpoints before calling the backend", async () => {
    expect((await route.POST(request("POST", { endpoint }, { Origin: "http://evil.test" }))).status).toBe(403);
    expect((await route.POST(request("POST", { endpoint, accountId: "someone-else" }))).status).toBe(400);
    expect((await route.POST(request("POST", { endpoint: "http://fcm.googleapis.com/x" }))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [401, 401],
    [403, 403],
    [503, 503],
    [500, 502],
  ])("maps backend %i to %i without exposing backend details", async (backend, expected) => {
    fetcher.mockResolvedValueOnce(Response.json({ message: "internal detail" }, { status: backend }));
    const response = await route.POST(request("POST"));
    expect(response.status).toBe(expected);
    expect(JSON.stringify(await response.json())).not.toContain("internal detail");
  });

  it("returns the push configuration and treats a malformed one as unavailable", async () => {
    fetcher.mockResolvedValueOnce(Response.json({ enabled: true, publicKey: "BPublicKey" }));
    const ok = await route.GET();
    expect(await ok.json()).toEqual({ enabled: true, publicKey: "BPublicKey" });
    fetcher.mockResolvedValueOnce(Response.json({ enabled: "yes" }));
    expect((await route.GET()).status).toBe(502);
  });
});
