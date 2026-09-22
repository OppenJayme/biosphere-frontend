import { describe, expect, it } from "vitest";
import {
  createSpecimenLotFormSchema,
  readCreateSpecimenLotForm,
} from "./form";

const STORAGE_ID = "30000000-0000-4000-8000-000000000001";

describe("specimen-lot creation form validation", () => {
  it("trims curator text, parses quantity, and converts blank optional fields", () => {
    expect(
      createSpecimenLotFormSchema.parse({
        storageUnitId: STORAGE_ID,
        conditionClass: " Good ",
        quantity: "12",
        storageNotes: " Drawer 2 ",
        reason: " ",
      }),
    ).toEqual({
      storageUnitId: STORAGE_ID,
      conditionClass: "Good",
      quantity: 12,
      storageNotes: "Drawer 2",
      reason: null,
    });
  });

  it("rejects invalid storage identifiers and unsafe quantities", () => {
    for (const quantity of ["", "0", "-1", "1.5", "2147483648"]) {
      expect(
        createSpecimenLotFormSchema.safeParse({
          storageUnitId: "not-a-uuid",
          conditionClass: "GOOD",
          quantity,
          storageNotes: "",
          reason: "",
        }).success,
      ).toBe(false);
    }
  });

  it("keeps condition classifications as required curator-managed text", () => {
    const result = createSpecimenLotFormSchema.safeParse({
      storageUnitId: STORAGE_ID,
      conditionClass: "   ",
      quantity: "1",
      storageNotes: "",
      reason: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.conditionClass).toEqual([
        "Enter the specimen condition.",
      ]);
    }
  });

  it("allowlists supported fields and ignores injected inventory values", () => {
    const formData = new FormData();
    formData.set("storageUnitId", STORAGE_ID);
    formData.set("conditionClass", "GOOD");
    formData.set("quantity", "3");
    formData.set("isActive", "false");
    formData.set("createdBy", "attacker-controlled");

    const parsed = readCreateSpecimenLotForm(formData);

    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data).not.toHaveProperty("isActive");
      expect(parsed.result.data).not.toHaveProperty("createdBy");
    }
  });
});
