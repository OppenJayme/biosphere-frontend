import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/features/specimens/cover-preview-action", () => ({ getSpecimenCoverPreview: vi.fn() }));
import { CoverPreviewContent } from "./SpecimenCoverPreview";
import type { CoverPreviewResult } from "../../features/specimens/cover-preview-action";

function render(result: CoverPreviewResult | null) {
  return renderToStaticMarkup(
    createElement(CoverPreviewContent, {
      result,
      alt: "Eagle cover",
      onRetry: vi.fn(),
      onImageError: vi.fn(),
    }),
  );
}

describe("cover preview states", () => {
  it("renders the private URL and an accessible caption", () => {
    const html = render({
      kind: "image",
      signedUrl: "https://example.com/signed",
      caption: "Museum eagle",
    });
    expect(html).toContain('src="https://example.com/signed"');
    expect(html).toContain('alt="Museum eagle"');
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).not.toContain("Retry cover image");
  });
  it("uses the specimen name when caption is blank", () => {
    expect(
      render({ kind: "image", signedUrl: "https://example.com/signed", caption: " " }),
    ).toContain('alt="Eagle cover"');
  });
  it("distinguishes loading, no cover and an error with retry", () => {
    expect(render(null)).toContain("Loading cover image");
    expect(render({ kind: "empty" })).toContain("No cover image selected.");
    expect(render({ kind: "empty" })).not.toContain("Retry cover image");
    const failure = render({ kind: "error", message: "Try again." });
    expect(failure).toContain("Try again.");
    expect(failure).toContain("Retry cover image");
    expect(failure).not.toContain("<img");
  });
});
