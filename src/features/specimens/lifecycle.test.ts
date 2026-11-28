/**
 * Tests the Cataloging lifecycle UI boundary without duplicating backend authorization.
 */

import { describe, expect, it } from "vitest";
import {
  archiveBlockReason,
  catalogedEditGuardMessage,
  publicDisplayCommand,
} from "./lifecycle";

describe("specimen lifecycle presentation rules", () => {
  it("offers public eligibility changes only for Cataloged specimens", () => {
    expect(publicDisplayCommand({ status: "UNCATALOGED", publicDisplay: false })).toBeNull();
    expect(publicDisplayCommand({ status: "ARCHIVED", publicDisplay: false })).toBeNull();
    expect(publicDisplayCommand({ status: "CATALOGED", publicDisplay: false })).toMatchObject({
      nextValue: true,
      label: "Mark publicly eligible",
    });
    expect(publicDisplayCommand({ status: "CATALOGED", publicDisplay: true })).toMatchObject({
      nextValue: false,
      label: "Remove public eligibility",
    });
  });

  it("blocks archive controls for archived records and active inventory lots", () => {
    expect(archiveBlockReason("ARCHIVED", 0)).toBe("This specimen is already archived.");
    expect(archiveBlockReason("CATALOGED", 1)).toContain("1 active specimen lot must");
    expect(archiveBlockReason("UNCATALOGED", 2)).toContain("2 active specimen lots must");
    expect(archiveBlockReason("CATALOGED", 0)).toBeNull();
  });
});

describe("cataloged edit guard", () => {
  it("surfaces the backend guard message and points to Reopen", () => {
    const message = catalogedEditGuardMessage({
      message: "Common name is required for a Cataloged specimen. Reopen cataloging before removing it.",
      statusCode: 400,
    });
    expect(message).toContain("Common name is required for a Cataloged specimen");
    expect(message).toContain("Reopen cataloging");
  });

  it("finds the guard inside a validation message array", () => {
    expect(
      catalogedEditGuardMessage({
        message: ["Kingdom is required for a Cataloged specimen. Reopen cataloging before removing it."],
      }),
    ).toContain("Kingdom is required");
  });

  it("ignores unrelated 400 bodies", () => {
    expect(catalogedEditGuardMessage({ message: "No changes were provided." })).toBeNull();
    expect(catalogedEditGuardMessage(null)).toBeNull();
  });
});
