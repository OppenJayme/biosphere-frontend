import { describe, expect, it } from "vitest";
import {
  parseSpecimenRevisionQuery,
  revisionFieldLabel,
  specimenRevisionHistoryHref,
} from "./revision-history";
import { specimenRevisionPageSchema } from "./types";

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";

describe("specimen revision-history query handling", () => {
  it("trims supported exact filters and keeps a safe page", () => {
    expect(
      parseSpecimenRevisionQuery({
        fieldChanged: "  scientific_name ",
        sourceSection: " specimen_core ",
        page: "3",
        changedBy: "not-supported-here",
      }),
    ).toEqual({
      fieldChanged: "scientific_name",
      sourceSection: "specimen_core",
      page: 3,
    });
  });

  it("bounds text and resets malformed pages", () => {
    expect(
      parseSpecimenRevisionQuery({
        fieldChanged: "x".repeat(101),
        sourceSection: ["specimen_taxonomy", "ignored"],
        page: "-1",
      }),
    ).toEqual({
      fieldChanged: "x".repeat(100),
      sourceSection: "specimen_taxonomy",
      page: 1,
    });
  });

  it("preserves filters in pagination links and omits default page", () => {
    const query = {
      fieldChanged: "family",
      sourceSection: "specimen_taxonomy",
      page: 2,
    };

    expect(specimenRevisionHistoryHref(SPECIMEN_ID, query, 1)).toBe(
      `/specimens/${SPECIMEN_ID}/history?fieldChanged=family&sourceSection=specimen_taxonomy`,
    );
    expect(specimenRevisionHistoryHref(SPECIMEN_ID, query, 3)).toBe(
      `/specimens/${SPECIMEN_ID}/history?fieldChanged=family&sourceSection=specimen_taxonomy&page=3`,
    );
  });

  it("creates readable labels without freezing source-section values", () => {
    expect(revisionFieldLabel("specimen_core")).toBe("Specimen Core");
    expect(revisionFieldLabel("future-approved-section")).toBe(
      "Future Approved Section",
    );
  });
});

describe("specimen revision-history response contract", () => {
  const response = {
    items: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        specimenId: SPECIMEN_ID,
        changedBy: {
          id: "30000000-0000-4000-8000-000000000001",
          fullName: "Museum Curator",
          role: "CURATOR",
        },
        fieldChanged: "scientific_name",
        oldValue: null,
        newValue: "Pithecophaga jefferyi",
        reason: null,
        sourceSection: "specimen_core",
        changedAt: "2026-09-22T10:00:00.000Z",
      },
    ],
    total: 1,
    page: 1,
    limit: 25,
  };

  it("accepts the protected backend revision shape", () => {
    expect(specimenRevisionPageSchema.safeParse(response).success).toBe(true);
  });

  it("rejects invalid actors and timestamps", () => {
    expect(
      specimenRevisionPageSchema.safeParse({
        ...response,
        items: [
          {
            ...response.items[0],
            changedBy: { ...response.items[0].changedBy, role: "PUBLIC" },
            changedAt: "not-a-timestamp",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
