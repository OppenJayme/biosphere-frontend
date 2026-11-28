import { describe, expect, it } from "vitest";
import {
  EMPTY_RECORD_FORM_VALUES,
  applyRemembered,
  readSpecimenRecordForm,
  recordChecklist,
  type RecordFormValues,
} from "./record-form";

const COLLECTION = "11111111-1111-4111-8111-111111111111";
const UNIT = "22222222-2222-4222-8222-222222222222";

const complete: RecordFormValues = {
  ...EMPTY_RECORD_FORM_VALUES,
  collectionId: COLLECTION,
  commonName: "Magellan birdwing",
  scientificName: "Troides magellanus",
  kingdom: "Animalia",
  collectionDate: "1958-03-14",
  preservationType: "Dry",
  preservationMethod: "Pinned",
  storageUnitId: UNIT,
  conditionClass: "Good",
  quantity: "2",
};

function formData(values: Partial<RecordFormValues>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const create = { mode: "create", hasActiveLot: false } as const;
const finish = { mode: "complete", hasActiveLot: false } as const;

describe("recordChecklist", () => {
  it("passes every requirement for a complete new record, with the accession assigned on save", () => {
    const checks = recordChecklist(complete, create);
    expect(checks.every((check) => check.passed)).toBe(true);
    expect(checks.find((check) => check.key === "accessionNumber")?.note).toMatch(/automatically/);
  });

  it("lists what is missing, by section", () => {
    const checks = recordChecklist({ ...EMPTY_RECORD_FORM_VALUES, commonName: "Atlas moth" }, create);
    expect(checks.filter((check) => !check.passed).map((check) => [check.key, check.section])).toEqual([
      ["collection", "basic"],
      ["kingdom", "taxonomy"],
      ["collectionDate", "provenance"],
      ["preservationType", "provenance"],
      ["preservationMethod", "provenance"],
      ["activeLot", "storage"],
    ]);
  });

  it("needs an accession number when completing a draft that has none", () => {
    const check = recordChecklist(complete, finish).find((item) => item.key === "accessionNumber");
    expect(check).toMatchObject({ passed: false, note: undefined });
  });

  it("rejects a future or malformed collection date", () => {
    const future = recordChecklist({ ...complete, collectionDate: "2999-01-01" }, create);
    const bad = recordChecklist({ ...complete, collectionDate: "14/03/1958" }, create);
    expect(future.find((check) => check.key === "collectionDate")?.passed).toBe(false);
    expect(bad.find((check) => check.key === "collectionDate")?.passed).toBe(false);
  });

  it("accepts an existing active lot, or a complete first lot", () => {
    const noLot = { ...complete, storageUnitId: "", conditionClass: "" };
    expect(recordChecklist(noLot, create).find((check) => check.key === "activeLot")?.passed).toBe(false);
    expect(recordChecklist(noLot, { mode: "complete", hasActiveLot: true }).find((check) => check.key === "activeLot")?.passed).toBe(true);
    expect(recordChecklist({ ...complete, quantity: "0" }, create).find((check) => check.key === "activeLot")?.passed).toBe(false);
  });
});

describe("readSpecimenRecordForm", () => {
  it("parses every section into one request, with a first lot", () => {
    const parsed = readSpecimenRecordForm(formData(complete), create);
    expect(parsed.errors).toBeUndefined();
    expect(parsed.input).toMatchObject({
      specimen: { collectionId: COLLECTION, commonName: "Magellan birdwing", accessionNumber: null },
      taxonomy: { kingdom: "Animalia", phylum: null },
      provenance: { collectionDate: "1958-03-14", preservationType: "Dry", preservationMethod: "Pinned" },
      lot: { storageUnitId: UNIT, conditionClass: "Good", quantity: 2, reason: null },
    });
  });

  it("saves a draft without a lot when the storage section is blank", () => {
    const parsed = readSpecimenRecordForm(formData({ commonName: "Atlas moth", quantity: "1" }), create);
    expect(parsed.input?.lot).toBeUndefined();
  });

  it("asks to finish a partly filled storage section", () => {
    const parsed = readSpecimenRecordForm(formData({ commonName: "Atlas moth", storageUnitId: UNIT, quantity: "1" }), create);
    expect(parsed.input).toBeUndefined();
    expect(parsed.errors?.conditionClass?.[0]).toMatch(/condition/i);
  });

  it("adds no lot when the record already has one", () => {
    const parsed = readSpecimenRecordForm(formData(complete), { mode: "complete", hasActiveLot: true });
    expect(parsed.input?.lot).toBeUndefined();
  });

  it("leaves a blank accession number out when completing a draft", () => {
    const parsed = readSpecimenRecordForm(formData(complete), finish);
    expect(parsed.input?.specimen).not.toHaveProperty("accessionNumber");
  });

  it("reports field errors from each section's own rules", () => {
    const parsed = readSpecimenRecordForm(
      formData({ ...complete, collectionDate: "2999-01-01", kingdom: "x".repeat(101) }),
      create,
    );
    expect(parsed.input).toBeUndefined();
    expect(parsed.errors?.collectionDate?.[0]).toMatch(/later than today/);
    expect(parsed.errors?.kingdom?.[0]).toMatch(/100 characters/);
  });
});

describe("applyRemembered", () => {
  const choices = { collectionIds: new Set([COLLECTION]), storageUnitIds: new Set([UNIT]) };

  it("fills blank fields with last-used values that are still valid", () => {
    const result = applyRemembered(
      EMPTY_RECORD_FORM_VALUES,
      { collectionId: COLLECTION, storageUnitId: UNIT, preservationType: "Dry", preservationMethod: "Pinned" },
      choices,
    );
    expect(result.applied).toEqual(["collectionId", "storageUnitId", "preservationType", "preservationMethod"]);
    expect(result.values).toMatchObject({ collectionId: COLLECTION, storageUnitId: UNIT, preservationMethod: "Pinned" });
  });

  it("never overwrites a value and skips choices that no longer exist", () => {
    const result = applyRemembered(
      { ...EMPTY_RECORD_FORM_VALUES, preservationType: "Wet" },
      { collectionId: "33333333-3333-4333-8333-333333333333", preservationType: "Dry" },
      choices,
    );
    expect(result.applied).toEqual([]);
    expect(result.values.preservationType).toBe("Wet");
  });
});
