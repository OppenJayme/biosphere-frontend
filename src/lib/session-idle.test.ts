import { describe, expect, it } from "vitest";
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

  it.each([undefined, "", "0", "-5", "soon"])("falls back to 30 minutes for %s", (value) => {
    expect(sessionIdleLimitMs(value)).toBe(1_800_000);
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
