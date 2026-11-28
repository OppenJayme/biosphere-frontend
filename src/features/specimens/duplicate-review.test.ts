import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DuplicateArchiveControl } from "@/components/specimens/DuplicateArchiveControl";
import {
  describeReviewMatch,
  matchedFieldsInGroup,
  reviewEditHrefs,
} from "./duplicate-review";
import { duplicateReviewSchema, type DuplicateReviewRecord } from "./types";

vi.mock("./lifecycle-actions", () => ({ archiveFromDuplicateReviewAction: vi.fn() }));

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";

function record(id: string, overrides: Partial<DuplicateReviewRecord> = {}): DuplicateReviewRecord {
  return {
    specimenId: id,
    accessionNumber: id === A ? "USC-BM-2026-0001" : "USC-BM-2026-0002",
    commonName: "Atlas moth",
    scientificName: "Attacus atlas",
    specimenCategory: "Insect",
    status: "UNCATALOGED",
    collectionName: "Entomology",
    collector: null,
    donor: null,
    collectionLocation: "Cebu",
    collectionDate: null,
    activeLotCount: 0,
    updatedAt: "2026-11-28T00:00:00.000Z",
    ...overrides,
  };
}

const review = duplicateReviewSchema.parse({
  recordCount: 2,
  groupCount: 1,
  groups: [
    {
      records: [record(A), record(B, { status: "CATALOGED", activeLotCount: 1 })],
      matches: [
        {
          firstSpecimenId: A,
          secondSpecimenId: B,
          confidence: "HIGH",
          matchedFields: ["SCIENTIFIC_NAME", "COMMON_NAME", "COLLECTION_LOCATION"],
          differingFields: ["COLLECTION_DATE"],
          message: "Possible duplicate: same scientific name, common name, collection location.",
        },
      ],
    },
  ],
});

describe("duplicate review presentation", () => {
  const [group] = review.groups;

  it("reads the backend review and keeps the count of distinct records", () => {
    expect(review.recordCount).toBe(2);
    expect(() => duplicateReviewSchema.parse({ ...review, groups: [{ ...group, matches: [] }] })).toThrow();
  });

  it("explains each pair with what matched and what differs", () => {
    expect(describeReviewMatch(group, group.matches[0])).toEqual({
      pair: "USC-BM-2026-0001 and USC-BM-2026-0002",
      confidence: "High confidence",
      matched: "Same scientific name, common name, collection location",
      differing: "Differs in collection date",
    });
    expect([...matchedFieldsInGroup(group)]).toEqual(["SCIENTIFIC_NAME", "COMMON_NAME", "COLLECTION_LOCATION"]);
  });

  it("edits an uncataloged record on its one-page form and a cataloged one in its editors", () => {
    expect(reviewEditHrefs(group.records[0])).toEqual({
      details: `/specimens/${A}/complete`,
      provenance: `/specimens/${A}/complete#section-provenance`,
    });
    expect(reviewEditHrefs(group.records[1])).toEqual({
      details: `/specimens/${B}/edit`,
      provenance: `/specimens/${B}/provenance`,
    });
  });
});

describe("archiving from the review page", () => {
  it("explains an active-lot restriction and links to the lots instead of archiving", () => {
    const html = renderToStaticMarkup(
      createElement(DuplicateArchiveControl, { record: record(B, { activeLotCount: 2 }), label: "USC-BM-2026-0002" }),
    );
    expect(html).toContain("Can&#x27;t archive yet");
    expect(html).toContain("2 active specimen lots must be resolved");
    expect(html).toContain(`href="/specimens/${B}/lots"`);
    expect(html).not.toContain("Yes, archive");
  });

  it("offers the confirmed archive when no lots are active", () => {
    const html = renderToStaticMarkup(
      createElement(DuplicateArchiveControl, { record: record(A), label: "USC-BM-2026-0001" }),
    );
    expect(html).toContain("Archive");
    expect(html).not.toContain("/lots");
  });
});
