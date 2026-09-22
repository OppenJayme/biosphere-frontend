import { describe, expect, it } from "vitest";
import { parseSpecimenListQuery, specimenDetailSchema, specimenListHref } from "./types";

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";
const ACCOUNT_ID = "20000000-0000-4000-8000-000000000001";
const STORAGE_ID = "30000000-0000-4000-8000-000000000001";
const LOT_ID = "40000000-0000-4000-8000-000000000001";
const TEST_DATE = "2026-09-21T00:00:00.000Z";

function specimenDetailResponse() {
  return {
    specimen: {
      id: SPECIMEN_ID,
      collectionId: null,
      accessionNumber: "USCBM-001",
      specimenCategory: "Bird",
      scientificName: "Pithecophaga jefferyi",
      commonName: "Philippine Eagle",
      gender: "UNKNOWN",
      classificationStatus: "Verified",
      status: "CATALOGED",
      publicDisplay: true,
      remarks: null,
      createdBy: ACCOUNT_ID,
      updatedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: TEST_DATE,
      updatedAt: TEST_DATE,
    },
    collection: null,
    taxonomy: null,
    provenance: null,
    activeLots: [
      {
        id: LOT_ID,
        specimenId: SPECIMEN_ID,
        storageUnitId: STORAGE_ID,
        conditionClass: "GOOD",
        quantity: 1,
        storageNotes: null,
        isActive: true,
        createdBy: ACCOUNT_ID,
        updatedBy: null,
        createdAt: TEST_DATE,
        updatedAt: TEST_DATE,
        storageUnit: {
          id: STORAGE_ID,
          label: "Cabinet A",
          unitType: "CABINET",
          storageType: "DRY_STORAGE",
          size: null,
          parentId: null,
          holdsSpecimens: true,
          capacity: null,
          archivedAt: null,
          createdAt: TEST_DATE,
          updatedAt: TEST_DATE,
        },
      },
    ],
    lotOverview: { activeLotCount: 1, totalQuantity: 1 },
    media: [],
    tags: [],
  };
}

describe("specimen catalog query handling", () => {
  it("keeps supported filters and creates a stable catalog URL", () => {
    const query = parseSpecimenListQuery({
      search: "  Philippine eagle  ",
      status: "CATALOGED",
      page: "3",
    });

    expect(query).toEqual({
      search: "Philippine eagle",
      status: "CATALOGED",
      page: 3,
    });
    expect(specimenListHref(query)).toBe(
      "/specimens?search=Philippine+eagle&status=CATALOGED&page=3",
    );
  });

  it("drops invalid URL input instead of forwarding it to the backend", () => {
    expect(
      parseSpecimenListQuery({
        search: "x".repeat(101),
        status: "DRAFT",
        page: "-4",
      }),
    ).toEqual({
      search: "x".repeat(100),
      status: null,
      page: 1,
    });
  });

  it("omits defaults from pagination links", () => {
    expect(specimenListHref({ search: "", status: null, page: 1 })).toBe("/specimens");
    expect(
      specimenListHref({ search: "frog", status: "UNCATALOGED", page: 2 }, 1),
    ).toBe("/specimens?search=frog&status=UNCATALOGED");
  });
});

describe("specimen detail response validation", () => {
  it("accepts the integrated backend detail contract", () => {
    expect(specimenDetailSchema.parse(specimenDetailResponse())).toMatchObject({
      specimen: { id: SPECIMEN_ID, status: "CATALOGED" },
      lotOverview: { activeLotCount: 1, totalQuantity: 1 },
    });
  });

  it("rejects inactive or zero-quantity entries from the active-lot contract", () => {
    const response = specimenDetailResponse();
    response.activeLots[0].isActive = false;
    response.activeLots[0].quantity = 0;

    expect(specimenDetailSchema.safeParse(response).success).toBe(false);
  });
});
