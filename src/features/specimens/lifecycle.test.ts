/**
 * Tests the Cataloging lifecycle UI boundary without duplicating backend authorization.
 */

import { describe, expect, it } from "vitest";
import {
  archiveBlockReason,
  groupMissingCatalogFields,
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

describe("catalog readiness checklist", () => {
  const id = "0b8f5f8e-3f7e-4d3a-9d1a-2c6a1f0e9b11";

  it("groups missing fields by editing section in page order with readable labels", () => {
    expect(
      groupMissingCatalogFields(id, [
        "activeLot",
        "taxonomy.orderName",
        "scientificName",
        "provenance.collectionDate",
        "taxonomy.genus",
      ]),
    ).toEqual([
      { title: "Core record", href: `/specimens/${id}/edit`, labels: ["Scientific name"] },
      { title: "Taxonomy", href: `/specimens/${id}/taxonomy`, labels: ["Order", "Genus"] },
      { title: "Provenance", href: `/specimens/${id}/provenance`, labels: ["Collection date"] },
      {
        title: "Specimen lots",
        href: `/specimens/${id}/lots/new`,
        labels: ["At least one active specimen lot"],
      },
    ]);
  });

  it("keeps unrecognised backend fields visible instead of dropping them", () => {
    expect(groupMissingCatalogFields(id, ["provenance.habitat"])).toEqual([
      { title: "Other", href: null, labels: ["provenance.habitat"] },
    ]);
  });

  it("returns no groups when nothing is missing", () => {
    expect(groupMissingCatalogFields(id, [])).toEqual([]);
  });
});
