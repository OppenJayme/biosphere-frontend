import { describe, expect, it, vi } from "vitest";
import {
  idleCookieString,
  isIdleExpired,
  lastActivityFromCookies,
  parseLastActivity,
  sessionIdleLimitMs,
} from "./session-idle";

describe("sessionIdleLimitMs", () => {
  it("uses the configured minutes", () => {
    expect(sessionIdleLimitMs("15")).toBe(900_000);
  });

  it.each(["", "0", "-5", "soon"])("refuses %s rather than assuming a period", (value) => {
    expect(() => sessionIdleLimitMs(value)).toThrow("NEXT_PUBLIC_SESSION_IDLE_MINUTES");
  });

  it("refuses to run with the setting missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SESSION_IDLE_MINUTES", undefined);
    expect(() => sessionIdleLimitMs()).toThrow("NEXT_PUBLIC_SESSION_IDLE_MINUTES");
    vi.unstubAllEnvs();
  });
});

describe("isIdleExpired", () => {
  const limit = 1_000;

  it("does not expire a session with no recorded activity", () => {
    expect(isIdleExpired(null, 5_000, limit)).toBe(false);
  });

  it("expires exactly at the limit, not before", () => {
    expect(isIdleExpired(4_001, 5_000, limit)).toBe(false);
    expect(isIdleExpired(4_000, 5_000, limit)).toBe(true);
  });
});

describe("last-activity cookie", () => {
  it.each([undefined, null, "", "abc", "-1", "0"])("ignores the malformed value %s", (value) => {
    expect(parseLastActivity(value)).toBeNull();
  });

  it("reads back what the browser writes", () => {
    const [pair] = idleCookieString(1_700_000_000_000).split(";");
    expect(lastActivityFromCookies(`other=1; ${pair}; biosphere_account=x`)).toBe(1_700_000_000_000);
  });

  it("does not match a cookie with a longer name", () => {
    expect(lastActivityFromCookies("biosphere_last_activity_old=5")).toBeNull();
  });
});
