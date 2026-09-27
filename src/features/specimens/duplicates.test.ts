import { describe, expect, it } from "vitest";
import {
  duplicateCheckCandidate,
  duplicateCheckOutcome,
  duplicateRecheckTrigger,
} from "./duplicates";
import {
  specimenCreateResultSchema,
  specimenDuplicateCheckResultSchema,
} from "./types";

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_ID = "10000000-0000-4000-8000-000000000002";
const ACCOUNT_ID = "20000000-0000-4000-8000-000000000001";
const TEST_DATE = "2026-09-26T00:00:00.000Z";

const possibleDuplicate = {
  specimenId: OTHER_ID,
  accessionNumber: "USCBM-001",
  scientificName: "Passer domesticus",
  commonName: "House sparrow",
  status: "UNCATALOGED",
  confidence: "HIGH",
  matchedFields: ["ACCESSION_NUMBER"],
  differingFields: ["COLLECTOR"],
  message: "Accession number USCBM-001 is already used by another specimen.",
};

function createResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: SPECIMEN_ID,
    collectionId: null,
    accessionNumber: "USCBM-001",
    specimenCategory: null,
    scientificName: "Passer domesticus",
    commonName: "House sparrow",
    gender: null,
    classificationStatus: null,
    status: "UNCATALOGED",
    publicDisplay: false,
    remarks: null,
    createdBy: ACCOUNT_ID,
    updatedBy: null,
    archivedBy: null,
    archivedAt: null,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    possibleDuplicates: [possibleDuplicate],
    duplicateCheckAvailable: true,
    ...overrides,
  };
}

describe("specimen duplicate contracts", () => {
  it("keeps possibleDuplicates and duplicateCheckAvailable on the created specimen", () => {
    const result = specimenCreateResultSchema.parse(createResponse());

    expect(result.duplicateCheckAvailable).toBe(true);
    expect(result.possibleDuplicates).toHaveLength(1);
    expect(result.possibleDuplicates[0].confidence).toBe("HIGH");
  });

  it("rejects a created specimen response without the duplicate-check flag", () => {
    const response: Record<string, unknown> = createResponse();
    delete response.duplicateCheckAvailable;

    expect(specimenCreateResultSchema.safeParse(response).success).toBe(false);
  });

  it("rejects unknown match fields and confidence levels", () => {
    const badField = { ...possibleDuplicate, matchedFields: ["GENDER"] };
    const badConfidence = { ...possibleDuplicate, confidence: "LOW" };

    for (const duplicate of [badField, badConfidence]) {
      expect(
        specimenDuplicateCheckResultSchema.safeParse({
          possibleDuplicates: [duplicate],
          duplicateCheckAvailable: true,
        }).success,
      ).toBe(false);
    }
  });
});

describe("duplicateCheckOutcome", () => {
  it("never reports an unavailable lookup as clear", () => {
    expect(
      duplicateCheckOutcome({ possibleDuplicates: [], duplicateCheckAvailable: false }),
    ).toBe("unavailable");
  });

  it("distinguishes found from clear", () => {
    const found = specimenDuplicateCheckResultSchema.parse({
      possibleDuplicates: [possibleDuplicate],
      duplicateCheckAvailable: true,
    });

    expect(duplicateCheckOutcome(found)).toBe("found");
    expect(
      duplicateCheckOutcome({ possibleDuplicates: [], duplicateCheckAvailable: true }),
    ).toBe("clear");
  });
});

describe("duplicateRecheckTrigger", () => {
  it("re-checks after a create, a core update, or a provenance save", () => {
    expect(duplicateRecheckTrigger({ created: "1" })).toBe("created");
    expect(duplicateRecheckTrigger({ updated: "1" })).toBe("updated");
    expect(duplicateRecheckTrigger({ provenance: "created" })).toBe("provenance");
    expect(duplicateRecheckTrigger({ provenance: ["updated"] })).toBe("provenance");
  });

  it("does not re-check for saves that cannot change the result", () => {
    expect(duplicateRecheckTrigger({})).toBeNull();
    expect(duplicateRecheckTrigger({ taxonomy: "updated" })).toBeNull();
    expect(duplicateRecheckTrigger({ lifecycle: "archived" })).toBeNull();
    expect(duplicateRecheckTrigger({ provenance: "anything" })).toBeNull();
  });

  it("ignores a result claimed in the URL", () => {
    // Only the trigger is read; the panel always asks the backend.
    expect(duplicateRecheckTrigger({ duplicates: "clear" })).toBeNull();
    expect(duplicateRecheckTrigger({ created: "1", duplicates: "clear" })).toBe("created");
  });
});

describe("duplicateCheckCandidate", () => {
  it("returns null when there is nothing to match on", () => {
    expect(
      duplicateCheckCandidate({ accessionNumber: " ", scientificName: "", commonName: "" }),
    ).toBeNull();
  });

  it("trims values, omits empty ones, and excludes the edited specimen", () => {
    expect(
      duplicateCheckCandidate(
        { accessionNumber: " USCBM-001 ", scientificName: "", commonName: "House sparrow" },
        SPECIMEN_ID,
      ),
    ).toEqual({
      accessionNumber: "USCBM-001",
      commonName: "House sparrow",
      excludeSpecimenId: SPECIMEN_ID,
    });
  });

  it("skips values the backend would reject", () => {
    expect(
      duplicateCheckCandidate({
        accessionNumber: "A".repeat(101),
        scientificName: "",
        commonName: "",
      }),
    ).toBeNull();
  });
});
