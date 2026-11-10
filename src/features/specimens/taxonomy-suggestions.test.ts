import { describe, expect, it } from "vitest";
import { classSuggestions, phylumSuggestions } from "./field-options";

describe("taxonomy suggestions", () => {
  it("narrows phyla to the chosen kingdom, ignoring case", () => {
    expect(phylumSuggestions("Fungi")).toContain("Basidiomycota");
    expect(phylumSuggestions("fungi")).not.toContain("Chordata");
  });

  it("offers every suggested phylum when the kingdom is blank or has none", () => {
    expect(phylumSuggestions("")).toEqual(expect.arrayContaining(["Chordata", "Tracheophyta"]));
    expect(phylumSuggestions("Bacteria")).toContain("Chordata");
  });

  it("narrows classes to the entered phylum", () => {
    expect(classSuggestions(" chordata ")).toEqual(expect.arrayContaining(["Aves", "Mammalia"]));
    expect(classSuggestions("Chordata")).not.toContain("Insecta");
    expect(classSuggestions("Unknownphyta")).toContain("Insecta");
  });
});
