/** Native picker contract; actual pointer/focus appearance needs browser retesting. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/specimens/media-actions", () => ({
  removeSpecimenMediaAction: vi.fn(),
  setSpecimenMediaCoverAction: vi.fn(),
  updateSpecimenMediaAction: vi.fn(),
}));

import { SpecimenMediaManager, type SpecimenMediaWithPreview } from "./SpecimenMediaManager";
import { SPECIMEN_MEDIA_ACCEPT } from "../../features/specimens/media-form";

const specimenId = "11111111-1111-4111-8111-111111111111";
const item: SpecimenMediaWithPreview = {
  id: "22222222-2222-4222-8222-222222222222",
  specimenId,
  storagePath: "private/image.png",
  displayOrder: 0,
  caption: null,
  isCover: true,
  createdAt: "2026-10-06T00:00:00Z",
  signedUrl: null,
};

function markup(readOnly = false, isCover = true) {
  return renderToStaticMarkup(
    createElement(SpecimenMediaManager, {
      specimenId,
      media: [{ ...item, isCover }],
      readOnly,
    }),
  );
}

describe("Cataloging native file feedback", () => {
  it("gives metadata/cover submit buttons working hover, focus and disabled feedback", () => {
    const html = markup(false, false);
    for (const label of ["Save metadata", "Set as cover"]) {
      const button = html.match(new RegExp(`<button\\b[^>]*>\\s*${label}\\s*</button>`))?.[0];
      expect(button).toBeDefined();
      expect(button).toContain('type="submit"');
      expect(button).toContain("enabled:hover:bg-forest-100");
      expect(button).toContain("focus-visible:outline-2");
      expect(button).toContain("disabled:cursor-not-allowed");
      expect(button).not.toContain("hover:bg-forest-50");
    }
  });

  it("uses identical hover, keyboard-focus and disabled styling for both pickers", () => {
    const inputs = markup().match(/<input\b[^>]*type="file"[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(2);
    const classes = inputs.map((input) => input.match(/class="([^"]*)"/)?.[1]);
    expect(classes[0]).toBe(classes[1]);
    for (const control of classes) {
      expect(control).toContain("enabled:hover:file:bg-forest-100");
      expect(control).toContain("focus-visible:outline-2");
      expect(control).toContain("focus-visible:outline-offset-2");
      expect(control).toContain("disabled:file:cursor-not-allowed");
      expect(control).toContain("disabled:file:bg-zinc-200");
    }
  });

  it("preserves native required inputs, labels and the approved image accept list", () => {
    const html = markup();
    const inputs = html.match(/<input\b[^>]*type="file"[^>]*>/g) ?? [];
    for (const input of inputs) {
      expect(input).toContain('name="file"');
      expect(input).toContain(`accept="${SPECIMEN_MEDIA_ACCEPT}"`);
      expect(input).toContain('required=""');
    }
    expect(html).toContain("Image file");
    expect(html).toContain("Replace image file");
  });

  it("does not expose upload/replacement pickers for archived read-only media", () => {
    expect(markup(true)).not.toContain('type="file"');
    expect(markup(true)).toContain("cannot be changed");
  });
});
