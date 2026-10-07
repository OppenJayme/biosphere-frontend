import { describe, expect, it } from "vitest";
import { loginErrorCode } from "./login-error";

describe("loginErrorCode", () => {
  it("blames the credentials only when the backend rejects them", () => {
    expect(loginErrorCode(401)).toBe("invalid_credentials");
    expect(loginErrorCode(403)).toBe("invalid_credentials");
  });

  it("reports the sign-in rate limit", () => {
    expect(loginErrorCode(429)).toBe("too_many_attempts");
  });

  it("reports a failing or unreachable backend, such as a dead tunnel's 502", () => {
    expect(loginErrorCode(500)).toBe("server_unavailable");
    expect(loginErrorCode(502)).toBe("server_unavailable");
    expect(loginErrorCode(503)).toBe("server_unavailable");
    expect(loginErrorCode(404)).toBe("server_unavailable");
  });
});
