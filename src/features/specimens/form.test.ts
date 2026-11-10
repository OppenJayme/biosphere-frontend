import { describe, expect, it } from "vitest";
import { readSpecimenForm, specimenFormSchema, specimenToFormValues } from "./form";

const COLLECTION_ID = "10000000-0000-4000-8000-000000000001";

describe("specimen core form validation", () => {
  it("trims entered values and converts empty optional fields to null", () => {
    expect(
      specimenFormSchema.parse({
        collectionId: ` ${COLLECTION_ID} `,
        accessionNumber: " USCBM-001 ",
        specimenCategory: " ",
        scientificName: " Pithecophaga jefferyi ",
        commonName: "",
        gender: "UNKNOWN",
        classificationStatus: " Verified ",
        remarks: "  Confirmed by curator.  ",
      }),
    ).toEqual({
      collectionId: COLLECTION_ID,
      accessionNumber: "USCBM-001",
      specimenCategory: null,
      scientificName: "Pithecophaga jefferyi",
      commonName: null,
      gender: "UNKNOWN",
      classificationStatus: "Verified",
      remarks: "Confirmed by curator.",
    });
  });

  it("rejects unsupported controlled values and overlong bounded fields", () => {
    const result = specimenFormSchema.safeParse({
      collectionId: "not-a-uuid",
      accessionNumber: "x".repeat(101),
      specimenCategory: "Bird",
      scientificName: "Pithecophaga jefferyi",
      commonName: "Philippine eagle",
      gender: "UNVERIFIED",
      classificationStatus: "Verified",
      remarks: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        collectionId: ["Select a valid collection."],
        accessionNumber: ["Must be 100 characters or fewer."],
        gender: ["Select a valid gender value."],
      });
    }
  });

  it("reads only the supported form fields and ignores injected fields", () => {
    const formData = new FormData();
    formData.set("accessionNumber", "USCBM-002");
    formData.set("status", "CATALOGED");
    formData.set("createdBy", "attacker-controlled");

    const parsed = readSpecimenForm(formData);

    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data.accessionNumber).toBe("USCBM-002");
      expect(parsed.result.data).not.toHaveProperty("status");
      expect(parsed.result.data).not.toHaveProperty("createdBy");
    }
  });

  it("maps nullable specimen values back into safe form strings", () => {
    const values = specimenToFormValues({
      id: "20000000-0000-4000-8000-000000000001",
      collectionId: null,
      accessionNumber: null,
      specimenCategory: "Bird",
      scientificName: null,
      commonName: "Philippine eagle",
      gender: null,
      classificationStatus: null,
      status: "UNCATALOGED",
      publicDisplay: false,
      remarks: null,
      createdBy: "30000000-0000-4000-8000-000000000001",
      updatedBy: null,
      archivedBy: null,
      archivedAt: null,
      createdAt: "2026-09-21T00:00:00.000Z",
      updatedAt: "2026-09-21T00:00:00.000Z",
    });

    expect(values).toMatchObject({
      collectionId: "",
      accessionNumber: "",
      specimenCategory: "Bird",
      commonName: "Philippine eagle",
      gender: "",
      remarks: "",
    });
  });
});
