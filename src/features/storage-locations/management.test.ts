import { describe, expect, it } from "vitest";
import {
  readStorageLocationForm,
  readStorageLocationMoveForm,
} from "./management";

describe("storage location form validation", () => {
  it("normalizes optional values without freezing curator-managed classifications", () => {
    const form = new FormData();
    form.set("label", " Cabinet A ");
    form.set("unitType", " Custom Cabinet ");
    form.set("storageType", " Dry Collection ");
    form.set("size", " ");
    form.set("parentId", "");
    form.set("holdsSpecimens", "on");
    form.set("capacity", "250");

    const parsed = readStorageLocationForm(form);
    expect(parsed.result.success).toBe(true);
    expect(parsed.result.success && parsed.result.data).toEqual({
      label: "Cabinet A",
      unitType: "Custom Cabinet",
      storageType: "Dry Collection",
      size: null,
      parentId: null,
      holdsSpecimens: true,
      capacity: 250,
    });
  });

  it("rejects invalid capacities before contacting the backend", () => {
    const form = new FormData();
    form.set("label", "Cabinet A");
    form.set("unitType", "Cabinet");
    form.set("storageType", "Dry");
    form.set("capacity", "2.5");

    expect(readStorageLocationForm(form).result.success).toBe(false);
  });

  it("maps a blank move parent and reason to null", () => {
    const form = new FormData();
    form.set("newParentId", "");
    form.set("reason", "");

    const parsed = readStorageLocationMoveForm(form);
    expect(parsed.result.success && parsed.result.data).toEqual({
      newParentId: null,
      reason: null,
    });
  });
});
