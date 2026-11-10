import { describe, expect, it } from "vitest";
import {
  filterCachedSpecimens,
  getCachedSpecimenCategories,
} from "./filters";
import type { CachedSpecimen } from "./types";

const OWNER_ID = "10000000-0000-4000-8000-000000000001";
const TEST_DATE = "2026-09-16T00:00:00.000Z";

function cachedSpecimen(
  overrides: Partial<CachedSpecimen> = {},
): CachedSpecimen {
  return {
    id: crypto.randomUUID(),
    ownerId: OWNER_ID,
    collectionId: null,
    accessionNumber: null,
    specimenCategory: null,
    scientificName: null,
    commonName: null,
    gender: null,
    classificationStatus: null,
    remarks: null,
    status: "UNCATALOGED",
    publicDisplay: false,
    createdBy: OWNER_ID,
    updatedBy: null,
    archivedBy: null,
    archivedAt: null,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    cachedAt: TEST_DATE,
    ...overrides,
  };
}

describe("offline cached specimen filters", () => {
  const specimens = [
    cachedSpecimen({
      id: "specimen-1",
      accessionNumber: "USCBM-001",
      commonName: "Ball Python",
      scientificName: "Python regius",
      specimenCategory: "Reptile",
      classificationStatus: "Verified",
      remarks: "Donated by the wildlife center",
      status: "CATALOGED",
    }),
    cachedSpecimen({
      id: "specimen-2",
      commonName: "Philippine Eagle",
      specimenCategory: "Bird",
      status: "UNCATALOGED",
    }),
  ];

  it("searches cached identifying and classification fields case-insensitively", () => {
    expect(
      filterCachedSpecimens(specimens, {
        search: "  python REGIUS ",
        status: "ALL",
        category: "",
      }).map((specimen) => specimen.id),
    ).toEqual(["specimen-1"]);

    expect(
      filterCachedSpecimens(specimens, {
        search: "wildlife center",
        status: "ALL",
        category: "",
      }).map((specimen) => specimen.id),
    ).toEqual(["specimen-1"]);

    expect(
      filterCachedSpecimens(specimens, {
        search: "verified",
        status: "ALL",
        category: "",
      }).map((specimen) => specimen.id),
    ).toEqual(["specimen-1"]);
  });

  it("combines status and curator-extensible category filters", () => {
    expect(
      filterCachedSpecimens(specimens, {
        search: "",
        status: "UNCATALOGED",
        category: "bird",
      }).map((specimen) => specimen.id),
    ).toEqual(["specimen-2"]);

    expect(
      filterCachedSpecimens(specimens, {
        search: "eagle",
        status: "CATALOGED",
        category: "Bird",
      }),
    ).toEqual([]);
  });

  it("builds sorted category choices without blank or case duplicates", () => {
    expect(
      getCachedSpecimenCategories([
        ...specimens,
        cachedSpecimen({ specimenCategory: " reptile " }),
        cachedSpecimen({ specimenCategory: "" }),
      ]),
    ).toEqual(["Bird", "Reptile"]);
  });
});
