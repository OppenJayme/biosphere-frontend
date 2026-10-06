/** Rendering/selection contracts; browser focus and saving require acceptance retesting. */
import { Children, createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/specimens/tag-actions", () => ({
  attachSpecimenTagAction: vi.fn(),
  changeSpecimenTagAction: vi.fn(),
  detachSpecimenTagAction: vi.fn(),
}));

import { ReusableTagSuggestions, SpecimenTagManager } from "./SpecimenTagManager";

const tags = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Acceptance test" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Endemic" },
];

describe("Cataloging reusable tag suggestions", () => {
  it("renders each matching name as a visible non-submit, keyboard-accessible button", () => {
    const html = renderToStaticMarkup(createElement(ReusableTagSuggestions, {
      tags, pending: false, onSelect: vi.fn(),
    }));
    expect(html).toContain('aria-label="Reusable tag suggestions"');
    for (const tag of tags) expect(html).toContain(`>${tag.name}</button>`);
    expect(html.match(/type="button"/g)).toHaveLength(2);
    expect(html).toContain("focus-visible:outline-2");
    expect(html).toContain("then click Attach tag to save");
  });

  it("forwards the exact chosen name without submitting a form", () => {
    const onSelect = vi.fn();
    const tree = ReusableTagSuggestions({ tags, pending: false, onSelect });
    const list = Children.toArray(tree.props.children)[1] as ReactElement<{ children: ReactElement[] }>;
    const item = list.props.children[0] as ReactElement<{ children: ReactElement<{ type: string; onClick: () => void }> }>;
    const button = item.props.children;
    expect(button.props.type).toBe("button");
    button.props.onClick();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("Acceptance test");
  });

  it("disables all choices while attaching", () => {
    const html = renderToStaticMarkup(createElement(ReusableTagSuggestions, {
      tags, pending: true, onSelect: vi.fn(),
    }));
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain("enabled:hover:bg-forest-100");
  });

  it("explains no results and does not render an empty choices list", () => {
    const html = renderToStaticMarkup(createElement(ReusableTagSuggestions, {
      tags: [], pending: false, onSelect: vi.fn(),
    }));
    expect(html).toContain("No reusable tags match this search");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<ul");
  });

  it("keeps archived records read-only even if suggestions were supplied", () => {
    const html = renderToStaticMarkup(createElement(SpecimenTagManager, {
      specimenId: tags[0].id, currentTags: [], availableTags: tags,
      search: "Acceptance", readOnly: true,
    }));
    expect(html).toContain("read-only");
    expect(html).not.toContain("Reusable tag suggestions");
    expect(html).not.toContain('name="tagName"');
  });

  it("keeps the existing tag-name input, datalist and bounded search", () => {
    const html = renderToStaticMarkup(createElement(SpecimenTagManager, {
      specimenId: tags[0].id, currentTags: [], availableTags: tags,
      search: "Endemic", readOnly: false,
    }));
    expect(html).toContain('name="tagName"');
    expect(html).toContain('list="available-specimen-tags"');
    expect(html).toContain('name="search"');
    expect(html).toContain('value="Endemic"');
    expect(html.match(/maxLength="100"/g)).toHaveLength(2);
  });
});
