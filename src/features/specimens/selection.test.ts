import { describe, expect, it } from "vitest";
import { selectedSpecimenId, specimenSelectionHref } from "./selection";
import { parseSpecimenListQuery } from "./types";

const first = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
const items = [{ id: first }, { id: second }];

describe("URL-backed catalog preview", () => {
  it("supports initial selection, another record, cleared selection and stale IDs", () => {
    expect(selectedSpecimenId(null, items)).toBe(first);
    expect(selectedSpecimenId(second, items)).toBe(second);
    expect(selectedSpecimenId("none", items)).toBeNull();
    expect(selectedSpecimenId("not-in-this-page", items)).toBeNull();
    expect(selectedSpecimenId(null, [])).toBeNull();
  });

  it("preserves filters and pagination in relative selection and clear links", () => {
    const query = parseSpecimenListQuery({
      search: "eagle",
      status: "CATALOGED",
      page: "2",
      family: "Accipitridae",
    });
    const url = new URL(specimenSelectionHref(query, second), "http://192.168.1.20:3000");
    expect(url.pathname).toBe("/specimens");
    expect(url.searchParams.get("search")).toBe("eagle");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("family")).toBe("Accipitridae");
    expect(url.searchParams.get("selected")).toBe(second);
    expect(url.hash).toBe("#selected-specimen");
    expect(specimenSelectionHref(query, null)).toContain("selected=none");
  });
});
