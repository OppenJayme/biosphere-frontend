/**
 * Contract tests for Cataloging tag normalization, field allowlisting, and API shapes.
 * They keep frontend behavior aligned with the curator-extensible backend vocabulary.
 */

import { describe, expect, it } from "vitest";
import {
  attachSpecimenTagFormSchema,
  parseTagSearch,
  readAttachSpecimenTagForm,
} from "./tag-form";
import {
  attachSpecimenTagResultSchema,
  changeSpecimenTagResultSchema,
  detachSpecimenTagResultSchema,
} from "./types";

const TAG_ID = "10000000-0000-4000-8000-000000000001";

describe("specimen tag form validation", () => {
  it("trims and collapses whitespace while preserving curator spelling", () => {
    expect(attachSpecimenTagFormSchema.parse({ tagName: "  Philippine   endemic  " })).toEqual({
      tagName: "Philippine endemic",
    });
  });

  it("supports Unicode names and punctuation but rejects controls and overlong names", () => {
    expect(attachSpecimenTagFormSchema.safeParse({ tagName: "Façade – endemic" }).success).toBe(true);
    expect(attachSpecimenTagFormSchema.safeParse({ tagName: "unsafe\u0000tag" }).success).toBe(false);
    expect(attachSpecimenTagFormSchema.safeParse({ tagName: "x".repeat(101) }).success).toBe(false);
  });

  it("allowlists tagName and ignores injected relationship fields", () => {
    const formData = new FormData();
    formData.set("tagName", "Endemic");
    formData.set("specimenId", "attacker-controlled");
    formData.set("tagId", "attacker-controlled");

    const parsed = readAttachSpecimenTagForm(formData);
    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data).toEqual({ tagName: "Endemic" });
    }
  });

  it("normalizes safe search values and drops invalid ones", () => {
    expect(parseTagSearch("  endemic   species ")).toBe("endemic species");
    expect(parseTagSearch(["Native", "ignored"])).toBe("Native");
    expect(parseTagSearch("bad\u0000search")).toBe("");
  });
});

describe("specimen tag response contracts", () => {
  it("accepts attach and detach responses and rejects incomplete results", () => {
    expect(
      attachSpecimenTagResultSchema.safeParse({
        tag: { id: TAG_ID, name: "Endemic" },
        attached: true,
      }).success,
    ).toBe(true);
    expect(
      detachSpecimenTagResultSchema.safeParse({ tagId: TAG_ID, detached: true }).success,
    ).toBe(true);
    expect(detachSpecimenTagResultSchema.safeParse({ tagId: TAG_ID }).success).toBe(false);
  });
});

describe("specimen tag change contract", () => {
  const tag = { id: "4f1c2b7e-8d3a-4c5b-9e6f-0a1b2c3d4e5f", name: "Visayas" };
  const previousTagId = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

  it("accepts the backend's changed and no-op responses", () => {
    expect(changeSpecimenTagResultSchema.safeParse({ tag, previousTagId, changed: true }).success).toBe(true);
    expect(changeSpecimenTagResultSchema.safeParse({ tag, previousTagId, changed: false }).success).toBe(true);
  });

  it("rejects a response without the previous tag id", () => {
    expect(changeSpecimenTagResultSchema.safeParse({ tag, changed: true }).success).toBe(false);
  });
});
