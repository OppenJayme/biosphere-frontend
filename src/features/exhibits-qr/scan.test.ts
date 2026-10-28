import { describe, expect, it } from "vitest";
import { exhibitPathFromScan } from "./scan";

const ORIGIN = "https://museum.example";

describe("exhibitPathFromScan", () => {
  it("accepts this site's exhibit labels", () => {
    expect(exhibitPathFromScan("https://museum.example/exhibits/giant-forest-beetle", ORIGIN)).toBe(
      "/exhibits/giant-forest-beetle",
    );
    expect(exhibitPathFromScan("  https://museum.example/exhibits/beetle-2/  ", ORIGIN)).toBe("/exhibits/beetle-2");
  });

  it("drops query strings and fragments", () => {
    expect(exhibitPathFromScan("https://museum.example/exhibits/beetle?utm=x#top", ORIGIN)).toBe("/exhibits/beetle");
  });

  it.each([
    ["another site", "https://evil.example/exhibits/beetle"],
    ["a look-alike host", "https://museum.example.evil.example/exhibits/beetle"],
    ["another scheme", "http://museum.example/exhibits/beetle"],
    ["another port", "https://museum.example:8443/exhibits/beetle"],
    ["a non-exhibit page", "https://museum.example/specimens/123"],
    ["the exhibits root", "https://museum.example/exhibits/"],
    ["a nested path", "https://museum.example/exhibits/beetle/edit"],
    ["an invalid slug", "https://museum.example/exhibits/Beetle_1"],
    ["an encoded traversal", "https://museum.example/exhibits/..%2Fspecimens"],
    ["plain text", "giant-forest-beetle"],
    ["a script URL", "javascript:alert(1)"],
  ])("rejects %s", (_label, raw) => {
    expect(exhibitPathFromScan(raw, ORIGIN)).toBeNull();
  });
});
