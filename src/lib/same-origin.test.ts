import { afterEach, describe, expect, it, vi } from "vitest";
import { isCrossSiteRequest } from "./same-origin";

function req(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { method: "POST", headers });
}

describe("isCrossSiteRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("allows a public-origin request behind a proxy when APP_ORIGIN is set", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/developer/ar-assets", {
          origin: "https://biosphere.dcism.org",
          "sec-fetch-site": "same-origin",
        }),
      ),
    ).toBe(false);
  });

  it("accepts APP_ORIGIN with a trailing slash", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org/");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "https://biosphere.dcism.org" }),
      ),
    ).toBe(false);
  });

  it("rejects a foreign origin when APP_ORIGIN is set", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "https://evil.example" }),
      ),
    ).toBe(true);
  });

  it("rejects the internal origin when APP_ORIGIN names the public one", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "http://localhost:3000" }),
      ),
    ).toBe(true);
  });

  it("falls back to the request URL origin when APP_ORIGIN is unset", () => {
    vi.stubEnv("APP_ORIGIN", "");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "http://localhost:3000" }),
      ),
    ).toBe(false);
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "https://biosphere.dcism.org" }),
      ),
    ).toBe(true);
  });

  it("always rejects Sec-Fetch-Site: cross-site", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org");
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", {
          origin: "https://biosphere.dcism.org",
          "sec-fetch-site": "cross-site",
        }),
      ),
    ).toBe(true);
  });

  it("allows requests without an Origin header", () => {
    vi.stubEnv("APP_ORIGIN", "https://biosphere.dcism.org");
    expect(isCrossSiteRequest(req("http://localhost:3000/api/reports"))).toBe(false);
  });

  it("fails closed on a malformed APP_ORIGIN", () => {
    vi.stubEnv("APP_ORIGIN", "not a url");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      isCrossSiteRequest(
        req("http://localhost:3000/api/reports", { origin: "http://localhost:3000" }),
      ),
    ).toBe(true);
  });
});
