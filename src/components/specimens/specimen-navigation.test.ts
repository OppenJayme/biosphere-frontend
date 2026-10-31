import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SpecimenTable } from "./SpecimenTable";
import { SpecimenDetailPanel } from "./SpecimenDetailPanel";
import type { SpecimenSearchItem } from "../../features/specimens/types";

vi.mock("@/features/specimens/cover-preview-action", () => ({ getSpecimenCoverPreview: vi.fn() }));

const specimen: SpecimenSearchItem = {
  id: "11111111-1111-4111-8111-111111111111",
  collectionId: null,
  accessionNumber: "TEST-1",
  commonName: "Test specimen",
  scientificName: null,
  specimenCategory: null,
  gender: null,
  classificationStatus: null,
  status: "UNCATALOGED",
  publicDisplay: false,
  remarks: null,
  createdBy: "22222222-2222-4222-8222-222222222222",
  updatedBy: null,
  archivedBy: null,
  archivedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  family: null,
  collector: null,
  totalQuantity: 0,
  conditionClasses: [],
  storageUnits: [],
};

describe("catalog navigation without JavaScript", () => {
  it("renders direct detail and preview links for every row", () => {
    const another = { ...specimen, id: "33333333-3333-4333-8333-333333333333" };
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(
      createElement(SpecimenTable, {
        specimens: [specimen, another],
        selectedId: specimen.id,
        onSelect,
        onOpen: vi.fn(),
        previewHref: (id: string) => `/specimens?selected=${id}`,
      }),
    );
    for (const record of [specimen, another]) {
      expect(html).toContain(`href="/specimens/${record.id}"`);
      expect(html).toContain(`href="/specimens?selected=${record.id}"`);
    }
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders clear as a real link rather than requiring a click handler", () => {
    const html = renderToStaticMarkup(
      createElement(SpecimenDetailPanel, {
        specimen,
        clearHref: "/specimens?selected=none",
        onClear: vi.fn(),
      }),
    );
    expect(html).toContain('href="/specimens?selected=none"');
    expect(html).toContain('aria-label="Clear selection"');
    expect(html).toContain('id="selected-specimen"');
  });
});
