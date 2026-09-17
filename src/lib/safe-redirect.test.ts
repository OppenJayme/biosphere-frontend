import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("allows a single-leading-slash internal path", () => {
    expect(getSafeRedirect("/specimens/42")).toBe("/specimens/42");
  });

  it("falls back to /dashboard when from is missing", () => {
    expect(getSafeRedirect(null)).toBe("/dashboard");
  });

  it("rejects protocol-relative // paths", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/dashboard");
  });

  it("rejects backslash-prefixed paths", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/dashboard");
    expect(getSafeRedirect("/\\\\evil.com")).toBe("/dashboard");
  });

  it("rejects absolute URLs and scheme-relative payloads", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("respects a custom fallback", () => {
    expect(getSafeRedirect("//evil.com", "/login")).toBe("/login");
  });
});
