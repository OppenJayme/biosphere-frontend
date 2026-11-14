import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SpecimenDetail } from "@/features/specimens/types";
import { SpecimenFullDetails } from "./SpecimenFullDetails";

const specimenId = "8b0e8b1a-7c1f-4f5e-9d58-1d2a4c6b7e01";

function detail(status: "UNCATALOGED" | "CATALOGED" | "ARCHIVED") {
  // Only the fields SpecimenFullDetails reads; the rest of the contract is covered by the schema tests.
  return {
    specimen: {
      id: specimenId,
      status,
      accessionNumber: "USCBM-EC G-02",
      specimenCategory: "Mollusk",
      commonName: "Giant African land snail",
      scientificName: "Achatina fulica",
      gender: null,
      classificationStatus: null,
      publicDisplay: false,
      remarks: null,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    },
    collection: null,
    taxonomy: null,
    provenance: null,
    activeLots: [],
    lotOverview: { activeLotCount: 0, totalQuantity: 0, zeroQuantityReason: null },
    media: [],
    tags: [],
  } as unknown as SpecimenDetail;
}

function basicDetailsSection(html: string) {
  const start = html.indexOf(">Basic details<");
  const end = html.indexOf(">Taxonomy<");
  expect(start).toBeGreaterThan(-1);
  return html.slice(start, end);
}

// Curator UAT 2026-11-14: the edit button belongs on the card it edits, not in the page header.
describe("SpecimenFullDetails basic details card", () => {
  it("puts Edit basic details on the Basic details card", () => {
    const html = renderToStaticMarkup(createElement(SpecimenFullDetails, { detail: detail("UNCATALOGED") }));
    const section = basicDetailsSection(html);
    expect(section).toContain(`href="/specimens/${specimenId}/edit"`);
    expect(section).toContain("Edit basic details");
  });

  it("keeps the button for cataloged specimens", () => {
    const html = renderToStaticMarkup(createElement(SpecimenFullDetails, { detail: detail("CATALOGED") }));
    expect(basicDetailsSection(html)).toContain("Edit basic details");
  });

  it("hides it on archived specimens, as before", () => {
    const html = renderToStaticMarkup(createElement(SpecimenFullDetails, { detail: detail("ARCHIVED") }));
    expect(html).not.toContain("Edit basic details");
    expect(html).not.toContain(`/specimens/${specimenId}/edit`);
  });
});
