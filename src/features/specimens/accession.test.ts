import { describe, expect, it } from "vitest";
import {
  accessionCheckFromAvailability,
  accessionConflictFromBody,
  accessionTakenMessage,
} from "./accession";
import { specimenCoreErrorMessage } from "./mutation-errors";

const holder = {
  id: "99999999-9999-4999-8999-999999999999",
  accessionNumber: "2026.1.1",
  scientificName: "Pithecophaga jefferyi",
  commonName: "Philippine eagle",
  status: "CATALOGED" as const,
};

const conflictBody = {
  statusCode: 409,
  error: "Conflict",
  code: "ACCESSION_NUMBER_TAKEN",
  message: 'Accession number "2026.1.1" is already assigned to another specimen record.',
  accessionNumber: "2026.1.1",
  conflictingSpecimen: holder,
};

describe("accession-number uniqueness", () => {
  it("names the record holding the number", () => {
    expect(accessionTakenMessage(" 2026.1.1 ", holder)).toBe(
      "Accession number “2026.1.1” is already assigned to Philippine eagle.",
    );
  });

  it("explains that archived numbers are never reused", () => {
    expect(accessionTakenMessage("2026.1.1", { ...holder, status: "ARCHIVED" })).toContain(
      "(archived; archived numbers are never reused)",
    );
  });

  it("falls back when the holder is unknown (write race)", () => {
    expect(accessionTakenMessage("2026.1.1", null)).toBe(
      "Accession number “2026.1.1” is already assigned to another specimen.",
    );
  });

  it("recognizes only the accession conflict code", () => {
    expect(accessionConflictFromBody(conflictBody)?.holder).toEqual(holder);
    expect(
      accessionConflictFromBody({ ...conflictBody, conflictingSpecimen: null })?.message,
    ).toContain("another specimen");
    expect(accessionConflictFromBody({ message: "Specimen changed during the operation." })).toBeNull();
    expect(accessionConflictFromBody(null)).toBeNull();
  });

  it("maps availability results to form states", () => {
    expect(
      accessionCheckFromAvailability({
        accessionNumber: "2026.1.1",
        available: true,
        conflictingSpecimen: null,
      }),
    ).toEqual({ status: "available" });
    expect(
      accessionCheckFromAvailability({
        accessionNumber: "2026.1.1",
        available: false,
        conflictingSpecimen: holder,
      }),
    ).toMatchObject({ status: "taken", holder });
  });

  it("prefers the accession message over the concurrent-change 409 copy", () => {
    const failure = { status: 409, body: conflictBody };
    expect(specimenCoreErrorMessage(failure, "update")).toBe(
      "Accession number “2026.1.1” is already assigned to Philippine eagle.",
    );
    expect(specimenCoreErrorMessage(failure, "create")).toBe(
      "Accession number “2026.1.1” is already assigned to Philippine eagle.",
    );
  });
});
