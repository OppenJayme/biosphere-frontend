import { describe, expect, it } from "vitest";
import {
  backendMessage,
  exhibitImageError,
  exhibitsHref,
  parseExhibitListQuery,
  readCreateExhibitForm,
  readMediaMetadataForm,
  readReplaceUrlForm,
  readUpdateExhibitForm,
  suggestSlug,
} from "./form";
import { exhibitLayout, publicExhibitSchema, sortExhibitMedia, splitFacts, titleFromSlug } from "./types";

const SPECIMEN_ID = "ac6f699b-08bf-4931-990d-b975b16b46bc";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("exhibit URL endings", () => {
  it("suggests a lowercase-hyphen slug from a specimen name", () => {
    expect(suggestSlug("Mountain Gorilla")).toBe("mountain-gorilla");
    expect(suggestSlug("  Blue-naped  Parrot (adult) ")).toBe("blue-naped-parrot-adult");
    expect(suggestSlug("Waling-wáling")).toBe("waling-waling");
  });

  it("rejects slugs the backend would reject", () => {
    expect(readReplaceUrlForm(form({ publicSlug: "Mountain Gorilla" })).ok).toBe(false);
    expect(readReplaceUrlForm(form({ publicSlug: "double--hyphen" })).ok).toBe(false);
    expect(readReplaceUrlForm(form({ publicSlug: "-leading" })).ok).toBe(false);
    expect(readReplaceUrlForm(form({ publicSlug: " gorilla-2 " }))).toMatchObject({ ok: true, publicSlug: "gorilla-2" });
  });
});

describe("create exhibit form", () => {
  it("leaves blank optional content out of the request", () => {
    const parsed = readCreateExhibitForm(
      form({
        specimenId: SPECIMEN_ID,
        publicSlug: "mountain-gorilla",
        layoutType: "card-grid",
        publicDescription: "  A gentle giant.  ",
        interestingFacts: "",
        distribution: "   ",
        diet: "Leaves",
      }),
    );
    expect(parsed.ok && parsed.input).toEqual({
      specimenId: SPECIMEN_ID,
      publicSlug: "mountain-gorilla",
      layoutType: "card-grid",
      publicDescription: "A gentle giant.",
      diet: "Leaves",
    });
  });

  it("reports each invalid field", () => {
    const parsed = readCreateExhibitForm(
      form({ specimenId: "", publicSlug: "Bad Slug", layoutType: "standard", distribution: "x".repeat(256) }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["distribution", "layoutType", "publicSlug", "specimenId"]);
    }
  });
});

describe("update exhibit form", () => {
  it("clears blank fields with null and keeps an unchanged layout out of the request", () => {
    const parsed = readUpdateExhibitForm(
      form({
        publicDescription: "New text",
        interestingFacts: "",
        distribution: "",
        diet: "",
        layoutType: "mobile-accordion",
        originalLayout: "mobile-accordion",
      }),
    );
    expect(parsed.ok && parsed.input).toEqual({
      publicDescription: "New text",
      interestingFacts: null,
      distribution: null,
      diet: null,
    });
  });

  it("sends the layout when the curator changes it", () => {
    const parsed = readUpdateExhibitForm(
      form({ publicDescription: "", interestingFacts: "", distribution: "", diet: "", layoutType: "card-grid", originalLayout: "mobile-accordion" }),
    );
    expect(parsed.ok && parsed.input.layoutType).toBe("card-grid");
  });

  it("never sends the URL ending, which the backend only changes through replace-url", () => {
    const base = { publicDescription: "", interestingFacts: "", distribution: "", diet: "", layoutType: "card-grid", originalLayout: "card-grid" };
    const parsed = readUpdateExhibitForm(form({ ...base, publicSlug: "canada-lynx", originalSlug: "lynx" }));
    expect(parsed.ok && parsed.input).not.toHaveProperty("publicSlug");
  });
});

describe("image metadata and files", () => {
  it("turns an empty caption into null and validates display order", () => {
    expect(readMediaMetadataForm(form({ caption: "  ", displayOrder: "" }))).toEqual({ ok: true, input: { caption: null } });
    expect(readMediaMetadataForm(form({ caption: "Side", displayOrder: "2" }))).toEqual({
      ok: true,
      input: { caption: "Side", displayOrder: 2 },
    });
    expect(readMediaMetadataForm(form({ caption: "", displayOrder: "-1" })).ok).toBe(false);
  });

  it("accepts only non-empty JPEG, PNG, or WebP images up to 15 MB", () => {
    expect(exhibitImageError(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
    expect(exhibitImageError(new File([], "a.png", { type: "image/png" }))).not.toBeNull();
    expect(exhibitImageError(new File(["x"], "a.gif", { type: "image/gif" }))).not.toBeNull();
    expect(exhibitImageError("not a file")).not.toBeNull();
  });
});

describe("curator list filters", () => {
  it("allowlists filters from the URL and round-trips them", () => {
    const query = parseExhibitListQuery({ status: "published", ar: "on", search: "  lynx " });
    expect(query).toEqual({ status: "PUBLISHED", ar: "on", search: "lynx" });
    expect(exhibitsHref(query, { selected: SPECIMEN_ID })).toBe(
      `/exhibits?status=published&ar=on&search=lynx&selected=${SPECIMEN_ID}`,
    );
    expect(parseExhibitListQuery({ status: "ARCHIVED", ar: "maybe" })).toEqual({ status: "", ar: "", search: "" });
  });
});

describe("backend messages", () => {
  it("shows specific messages but hides ones that expose raw identifiers", () => {
    expect(backendMessage({ message: "Only a published exhibit can be disabled." })).toBe(
      "Only a published exhibit can be disabled.",
    );
    expect(backendMessage({ message: ["publicSlug may only contain lowercase letters"] })).toBe(
      "publicSlug may only contain lowercase letters",
    );
    expect(backendMessage({ message: `Specimen ${SPECIMEN_ID} already has an active exhibit.` })).toBeNull();
    expect(backendMessage(null)).toBeNull();
  });
});

describe("public exhibit helpers", () => {
  it("renders card-grid only when chosen and accordion for anything else", () => {
    expect(exhibitLayout("card-grid")).toBe("card-grid");
    expect(exhibitLayout("standard")).toBe("mobile-accordion");
    expect(exhibitLayout(null)).toBe("mobile-accordion");
  });

  it("orders the cover first, then by display order", () => {
    const sorted = sortExhibitMedia([
      { id: "a", isCover: false, displayOrder: 0 },
      { id: "b", isCover: true, displayOrder: 5 },
      { id: "c", isCover: false, displayOrder: 1 },
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("turns a URL ending into a page title", () => {
    expect(titleFromSlug("giant-forest-beetle")).toBe("Giant Forest Beetle");
  });

  it("splits facts one per line and strips list bullets", () => {
    expect(splitFacts("- First fact\n\n• Second fact\r\n  Third  ")).toEqual(["First fact", "Second fact", "Third"]);
    expect(splitFacts(null)).toEqual([]);
  });

  it("drops any field outside the approved public contract", () => {
    const parsed = publicExhibitSchema.parse({
      publicSlug: "canada-lynx",
      commonName: "Canada Lynx",
      scientificName: "Lynx canadensis",
      collection: null,
      taxonomy: { kingdom: null, phylum: null, class: null, order: null, family: null, genus: null, species: null },
      habitat: null,
      ecologicalRole: null,
      conservationStatus: null,
      interestingFacts: null,
      publicDescription: null,
      distribution: null,
      diet: null,
      layoutType: "standard",
      media: [],
      ar: { available: false, models: [] },
      storageLocation: "Cabinet 4",
      accessionNumber: "SPEC-1008",
    });
    expect(parsed).not.toHaveProperty("storageLocation");
    expect(parsed).not.toHaveProperty("accessionNumber");
  });
});
