/** Media history is readable presentation, not a rewrite of immutable revision evidence. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SpecimenRevisionHistory } from "./SpecimenRevisionHistory";
import { revisionDisplayValue, revisionEventLabel } from "../../features/specimens/revision-history";
import type { SpecimenRevisionPage } from "../../features/specimens/types";

const mediaId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";

describe("Cataloging media revision presentation", () => {
  it.each([
    [null, mediaId, "Image added"],
    [mediaId, null, "Image removed"],
    [mediaId, otherId, "Media record changed"],
    [null, null, "Media record changed"],
  ])("describes recorded media transitions without inferring filenames", (oldValue, newValue, label) => {
    expect(revisionEventLabel("specimen_media", oldValue, newValue)).toBe(label);
  });

  it("keeps file, cover, caption and ordering events distinguishable", () => {
    expect(revisionEventLabel("specimen_media.file", "old", "new")).toBe("Image file replaced");
    expect(revisionEventLabel("specimen_media.cover", mediaId, otherId)).toBe("Cover image changed");
    expect(revisionEventLabel("specimen_media.caption", "old", "new")).toBe("Image caption changed");
    expect(revisionEventLabel("specimen_media.display_order", "1", "0")).toBe("Image display order changed");
    expect(revisionDisplayValue("0", "specimen_media.display_order", "new")).toBe("0");
    expect(revisionDisplayValue("Bird", "specimen_media.caption", "new")).toBe("Bird");
    expect(revisionDisplayValue(null, "specimen_media.caption", "new")).toBe("Not recorded");
  });

  it("provides explicit missing-file and cover states", () => {
    expect(revisionDisplayValue(null, "specimen_media", "previous")).toBe("No image record");
    expect(revisionDisplayValue("", "specimen_media.file", "new")).toBe("No image file recorded");
    expect(revisionDisplayValue(null, "specimen_media.cover", "previous")).toBe("No cover image selected");
    expect(revisionDisplayValue(mediaId, "specimen_media.cover", "new")).toBe("Selected cover image");
  });

  it("preserves tag, core and future-field formatting", () => {
    expect(revisionDisplayValue(null, "specimen_tags", "previous")).toBe("None (tag added)");
    expect(revisionDisplayValue(null, "specimen_tags", "new")).toBe("None (tag removed)");
    expect(revisionDisplayValue("Endemic", "specimen_tags", "new")).toBe("Endemic");
    expect(revisionDisplayValue("Animalia", "kingdom", "new")).toBe("Animalia");
    expect(revisionDisplayValue(null, "common_name", "previous")).toBe("Not recorded");
    expect(revisionEventLabel("future_field", null, "value")).toBe("Future Field");
  });

  it("renders without raw media IDs/paths and leaves the input evidence intact", () => {
    const history: SpecimenRevisionPage = {
      page: 1, limit: 25, total: 4,
      items: [
        { fieldChanged: "specimen_media", oldValue: null, newValue: mediaId },
        { fieldChanged: "specimen_media", oldValue: mediaId, newValue: null },
        { fieldChanged: "specimen_media.file", oldValue: `${mediaId}/old.png`, newValue: `${mediaId}/new.jpg` },
        { fieldChanged: "specimen_media.cover", oldValue: mediaId, newValue: otherId },
      ].map((entry, index) => ({
        ...entry, id: `revision-${index}`, specimenId: "specimen",
        changedBy: { id: "curator", fullName: "Museum Curator", role: "CURATOR" },
        changedAt: "2026-10-06T00:00:00Z", sourceSection: "specimen_media", reason: null,
      })),
    };
    const before = JSON.stringify(history);
    const html = renderToStaticMarkup(createElement(SpecimenRevisionHistory, {
      specimenId: "specimen", history, fieldOptions: [],
      query: { page: 1, fieldChanged: "", sourceSection: "" },
    }));
    for (const label of ["Image added", "Image removed", "Image file replaced", "Cover image changed"]) {
      expect(html).toContain(label);
    }
    expect(html).not.toContain(mediaId);
    expect(html).not.toContain(otherId);
    expect(html).not.toContain("old.png");
    expect(html).not.toContain("new.jpg");
    expect(JSON.stringify(history)).toBe(before);
  });
});
