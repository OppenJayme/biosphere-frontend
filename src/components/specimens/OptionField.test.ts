/** Server-rendered starting states; choosing options is checked in the browser, not here. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  KINGDOM_OPTIONS,
  PRESERVATION_TYPE_OPTIONS,
  SPECIMEN_CATEGORY_OPTIONS,
  preservationMethodSuggestions,
  type FieldOptionList,
} from "@/features/specimens/field-options";
import { OptionField } from "./OptionField";

function render(list: FieldOptionList, defaultValue: string) {
  return renderToStaticMarkup(
    createElement(OptionField, {
      id: "field",
      name: "field",
      list,
      label: "value",
      maxLength: 100,
      defaultValue,
      className: "control",
    }),
  );
}

describe("OptionField", () => {
  it("offers Not recorded, the list and Other for an open list", () => {
    const html = render(SPECIMEN_CATEGORY_OPTIONS, "");
    expect(html).toContain('<option value="" selected="">Not recorded</option>');
    expect(html).toContain('<option value="Insect">Insect</option>');
    expect(html).toContain('<option value="__other__">Other…</option>');
    expect(html).not.toContain("<input");
  });

  it("adopts the listed spelling for a case-only difference", () => {
    const html = render(SPECIMEN_CATEGORY_OPTIONS, "  insect ");
    expect(html).toContain('<select id="field" name="field"');
    expect(html).toContain('<option value="Insect" selected="">Insect</option>');
  });

  it("keeps an unlisted value in the Other box, which alone submits", () => {
    const html = render(SPECIMEN_CATEGORY_OPTIONS, "Lichen");
    expect(html).toContain('<option value="__other__" selected="">Other…</option>');
    expect(html).not.toContain('<select id="field" name="field"');
    expect(html).toMatch(/<input type="text"[^>]*name="field" value="Lichen"/);
  });

  it("has no Other on a closed list but keeps an existing unlisted value selectable", () => {
    const html = render(KINGDOM_OPTIONS, "Chromista");
    expect(html).not.toContain("Other…");
    expect(html).toContain('<option value="Chromista" selected="">Chromista (not on the list)</option>');
    expect(html).toContain('<select id="field" name="field"');
  });

  it("narrows preservation method suggestions to the chosen type", () => {
    expect(preservationMethodSuggestions("Wet")).toContain("70% ethanol");
    expect(preservationMethodSuggestions("wet")).not.toContain("Pinned");
    expect(preservationMethodSuggestions("")).toEqual(
      expect.arrayContaining(["Pinned", "70% ethanol"]),
    );
    expect(PRESERVATION_TYPE_OPTIONS.allowOther).toBe(true);
  });
});
