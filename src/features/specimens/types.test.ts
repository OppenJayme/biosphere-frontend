import { describe, expect, it } from "vitest";
import {
  hasAdvancedSpecimenFilters,
  parseSpecimenListQuery,
  specimenCreatedBounds,
  specimenDateRangeError,
  specimenDetailSchema,
  specimenListHref,
  specimenPageSchema,
} from "./types";

const NO_ADVANCED_FILTERS = {
  classificationStatus: "",
  kingdom: "",
  phylum: "",
  taxonClass: "",
  taxonOrder: "",
  family: "",
  genus: "",
  species: "",
  tag: "",
  conditionClass: "",
  storageUnitId: null,
  includeDescendantUnits: true,
  createdFrom: "",
  createdTo: "",
};
const UNIT_ID = "d0000000-0000-4000-8000-000000000001";

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";
const ACCOUNT_ID = "20000000-0000-4000-8000-000000000001";
const STORAGE_ID = "30000000-0000-4000-8000-000000000001";
const LOT_ID = "40000000-0000-4000-8000-000000000001";
const COLLECTION_ID = "50000000-0000-4000-8000-000000000001";
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
      collectionId: COLLECTION_ID,
      specimenCategory: "  Bird  ",
      gender: "UNKNOWN",
      publicDisplay: "true",
      sortBy: "scientificName",
      sortDirection: "asc",
      page: "3",
    });

    expect(query).toEqual({
      search: "Philippine eagle",
      status: "CATALOGED",
      collectionId: COLLECTION_ID,
      specimenCategory: "Bird",
      gender: "UNKNOWN",
      publicDisplay: true,
      sortBy: "scientificName",
      sortDirection: "asc",
      page: 3,
      ...NO_ADVANCED_FILTERS,
    });
    expect(specimenListHref(query)).toBe(
      `/specimens?search=Philippine+eagle&status=CATALOGED&collectionId=${COLLECTION_ID}&specimenCategory=Bird&gender=UNKNOWN&publicDisplay=true&sortBy=scientificName&sortDirection=asc&page=3`,
    );
  });

  it("drops invalid URL input instead of forwarding it to the backend", () => {
    expect(
      parseSpecimenListQuery({
        search: "x".repeat(101),
        status: "DRAFT",
        collectionId: "not-a-uuid",
        specimenCategory: "  ",
        gender: "ANY",
        publicDisplay: "yes",
        sortBy: "quantity",
        sortDirection: "sideways",
        page: "-4",
      }),
    ).toEqual({
      search: "x".repeat(100),
      status: null,
      collectionId: null,
      specimenCategory: "",
      gender: null,
      publicDisplay: null,
      sortBy: "updatedAt",
      sortDirection: "desc",
      page: 1,
      ...NO_ADVANCED_FILTERS,
    });
  });

  it("omits defaults from pagination links", () => {
    const defaultQuery = parseSpecimenListQuery({});
    expect(specimenListHref(defaultQuery)).toBe("/specimens");
    expect(
      specimenListHref(
        { ...defaultQuery, search: "frog", status: "UNCATALOGED", page: 2 },
        1,
      ),
    ).toBe("/specimens?search=frog&status=UNCATALOGED");
  });
});

describe("specimen catalog advanced filters", () => {
  it("keeps taxonomy, condition, location, tag, and date filters in the URL", () => {
    const query = parseSpecimenListQuery({
      family: "  Papilionidae ",
      genus: "Papilio",
      classificationStatus: "Identified",
      conditionClass: "Good",
      tag: "Type specimen",
      storageUnitId: UNIT_ID,
      includeDescendantUnits: "false",
      createdFrom: "2026-09-01",
      createdTo: "2026-09-30",
      sortBy: "family",
    });

    expect(query).toMatchObject({
      family: "Papilionidae",
      genus: "Papilio",
      storageUnitId: UNIT_ID,
      includeDescendantUnits: false,
      createdFrom: "2026-09-01",
      createdTo: "2026-09-30",
      sortBy: "family",
    });
    expect(hasAdvancedSpecimenFilters(query)).toBe(true);
    expect(specimenListHref(query)).toBe(
      `/specimens?classificationStatus=Identified&family=Papilionidae&genus=Papilio&tag=Type+specimen&conditionClass=Good&storageUnitId=${UNIT_ID}&includeDescendantUnits=false&createdFrom=2026-09-01&createdTo=2026-09-30&sortBy=family`,
    );
  });

  it("drops malformed locations and dates and keeps sub-locations on by default", () => {
    const query = parseSpecimenListQuery({
      storageUnitId: "room-101",
      includeDescendantUnits: "yes",
      createdFrom: "2026-02-30",
      createdTo: "30/09/2026",
      species: "x".repeat(150),
    });

    expect(query).toMatchObject({
      storageUnitId: null,
      includeDescendantUnits: true,
      createdFrom: "",
      createdTo: "",
      species: "x".repeat(100),
    });
    expect(hasAdvancedSpecimenFilters(parseSpecimenListQuery({}))).toBe(false);
    // The sub-location opt-out only matters with a location.
    expect(specimenListHref({ ...parseSpecimenListQuery({}), includeDescendantUnits: false })).toBe("/specimens");
  });

  it("flags a reversed date range and sends museum-time day bounds", () => {
    const query = parseSpecimenListQuery({ createdFrom: "2026-09-30", createdTo: "2026-09-01" });
    expect(specimenDateRangeError(query)).toBe("The Date added start must not be after its end.");
    expect(specimenDateRangeError(parseSpecimenListQuery({ createdFrom: "2026-09-01" }))).toBeNull();
    expect(specimenCreatedBounds({ createdFrom: "2026-09-01", createdTo: "2026-09-30" })).toEqual({
      from: "2026-09-01T00:00:00.000+08:00",
      to: "2026-09-30T23:59:59.999+08:00",
    });
  });
});

describe("specimen catalog page validation", () => {
  it("accepts search rows with family, quantity, condition, and storage columns", () => {
    const row = {
      ...specimenDetailResponse().specimen,
      family: "Papilionidae",
      collector: null,
      totalQuantity: 5,
      conditionClasses: ["Good"],
      storageUnits: [{ id: UNIT_ID, label: "Drawer 3", unitType: "Drawer", pathLabel: "Room 101 › Cabinet A › Drawer 3" }],
    };
    expect(specimenPageSchema.parse({ items: [row], total: 1, page: 1, limit: 25 }).items[0]).toMatchObject({
      totalQuantity: 5,
      storageUnits: [{ pathLabel: "Room 101 › Cabinet A › Drawer 3" }],
    });
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
