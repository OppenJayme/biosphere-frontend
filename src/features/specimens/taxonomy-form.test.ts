import { describe, expect, it } from "vitest";
import {
  readTaxonomyForm,
  taxonomyFormSchema,
  taxonomyToFormValues,
} from "./taxonomy-form";

describe("specimen taxonomy form validation", () => {
  it("trims taxonomy values and converts blank fields to null", () => {
    expect(
      taxonomyFormSchema.parse({
        kingdom: " Animalia ",
        phylum: " Chordata ",
        class: " Aves ",
        orderName: " ",
        family: "Accipitridae",
        genus: "Pithecophaga",
        species: "jefferyi",
        habitat: " Philippine forests ",
        ecologicalRole: " Apex predator ",
        conservationStatus: "Critically Endangered",
      }),
    ).toMatchObject({
      kingdom: "Animalia",
      phylum: "Chordata",
      orderName: null,
      habitat: "Philippine forests",
      ecologicalRole: "Apex predator",
    });
  });

  it("enforces the backend field length limits", () => {
    const result = taxonomyFormSchema.safeParse({
      kingdom: "x".repeat(101),
      phylum: "",
      class: "",
      orderName: "",
      family: "",
      genus: "",
      species: "",
      habitat: "x".repeat(251),
      ecologicalRole: "",
      conservationStatus: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        kingdom: ["Must be 100 characters or fewer."],
        habitat: ["Must be 250 characters or fewer."],
      });
    }
  });

  it("requires one value when creating but permits clearing values during an update", () => {
    const formData = new FormData();

    const createResult = readTaxonomyForm(formData, "create").result;
    const updateResult = readTaxonomyForm(formData, "update").result;

    expect(createResult.success).toBe(false);
    if (!createResult.success) {
      expect(createResult.error.flatten().formErrors).toEqual([
        "Enter at least one taxonomy value before creating the record.",
      ]);
    }
    expect(updateResult.success).toBe(true);
  });

  it("allowlists taxonomy fields and ignores injected specimen controls", () => {
    const formData = new FormData();
    formData.set("kingdom", "Animalia");
    formData.set("status", "CATALOGED");
    formData.set("specimenId", "attacker-controlled");

    const parsed = readTaxonomyForm(formData, "create");

    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data.kingdom).toBe("Animalia");
      expect(parsed.result.data).not.toHaveProperty("status");
      expect(parsed.result.data).not.toHaveProperty("specimenId");
    }
  });

  it("maps an existing taxonomy record into safe editable strings", () => {
    expect(
      taxonomyToFormValues({
        specimenId: "10000000-0000-4000-8000-000000000001",
        kingdom: "Animalia",
        phylum: null,
        class: "Aves",
        orderName: null,
        family: null,
        genus: "Pithecophaga",
        species: "jefferyi",
        habitat: null,
        ecologicalRole: null,
        conservationStatus: "Critically Endangered",
      }),
    ).toMatchObject({
      kingdom: "Animalia",
      phylum: "",
      orderName: "",
      habitat: "",
      conservationStatus: "Critically Endangered",
    });
  });
});
