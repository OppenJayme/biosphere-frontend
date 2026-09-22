import { describe, expect, it } from "vitest";
import {
  provenanceFormSchema,
  provenanceToFormValues,
  readProvenanceForm,
} from "./provenance-form";

describe("specimen provenance form validation", () => {
  it("trims text, keeps a date-only value, and converts blanks to null", () => {
    expect(
      provenanceFormSchema.parse({
        collector: " Dr. Maria Santos ",
        donor: " ",
        collectionDate: "2026-09-10",
        collectionLocation: " Cebu, Philippines ",
        preservationType: " Wet specimen ",
        preservationMethod: " 70% ethanol ",
      }),
    ).toEqual({
      collector: "Dr. Maria Santos",
      donor: null,
      collectionDate: "2026-09-10",
      collectionLocation: "Cebu, Philippines",
      preservationType: "Wet specimen",
      preservationMethod: "70% ethanol",
    });
  });

  it("rejects invalid calendar dates and overlong text", () => {
    const result = provenanceFormSchema.safeParse({
      collector: "x".repeat(256),
      donor: "",
      collectionDate: "2026-02-30",
      collectionLocation: "",
      preservationType: "",
      preservationMethod: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        collector: ["Must be 255 characters or fewer."],
        collectionDate: ["Enter a valid date in YYYY-MM-DD format."],
      });
    }
  });

  it("requires one value for creation but permits clearing values during update", () => {
    const formData = new FormData();

    const createResult = readProvenanceForm(formData, "create").result;
    const updateResult = readProvenanceForm(formData, "update").result;

    expect(createResult.success).toBe(false);
    if (!createResult.success) {
      expect(createResult.error.flatten().formErrors).toEqual([
        "Enter at least one provenance or preservation value before creating the record.",
      ]);
    }
    expect(updateResult.success).toBe(true);
  });

  it("allowlists supported provenance fields and ignores injected controls", () => {
    const formData = new FormData();
    formData.set("collector", "Dr. Maria Santos");
    formData.set("status", "CATALOGED");
    formData.set("updatedAt", "attacker-controlled");

    const parsed = readProvenanceForm(formData, "create");

    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data.collector).toBe("Dr. Maria Santos");
      expect(parsed.result.data).not.toHaveProperty("status");
      expect(parsed.result.data).not.toHaveProperty("updatedAt");
    }
  });

  it("maps an existing provenance record into editable form values", () => {
    expect(
      provenanceToFormValues({
        specimenId: "10000000-0000-4000-8000-000000000001",
        collector: "Dr. Maria Santos",
        donor: null,
        collectionDate: "2026-09-10",
        collectionLocation: "Cebu, Philippines",
        preservationType: null,
        preservationMethod: "70% ethanol",
        updatedAt: "2026-09-21T00:00:00.000Z",
      }),
    ).toEqual({
      collector: "Dr. Maria Santos",
      donor: "",
      collectionDate: "2026-09-10",
      collectionLocation: "Cebu, Philippines",
      preservationType: "",
      preservationMethod: "70% ethanol",
    });
  });
});
