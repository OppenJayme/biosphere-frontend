/**
 * Tests the Cataloging lifecycle UI boundary without duplicating backend authorization.
 */

import { describe, expect, it } from "vitest";
import { archiveBlockReason, publicDisplayCommand } from "./lifecycle";

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
