/**
 * Contract tests for Cataloging media size/type rules, metadata normalization,
 * request allowlisting, and protected backend response shapes.
 */

import { describe, expect, it } from "vitest";
import {
  readSpecimenMediaMetadataForm,
  readSpecimenMediaUploadForm,
  SPECIMEN_MEDIA_MAX_BYTES,
  toSpecimenMediaUploadFormData,
} from "./media-form";
import {
  removeSpecimenMediaResultSchema,
  replaceSpecimenMediaResultSchema,
  specimenMediaSchema,
  specimenMediaSignedUrlSchema,
} from "./types";

const MEDIA_ID = "10000000-0000-4000-8000-000000000001";
const SPECIMEN_ID = "10000000-0000-4000-8000-000000000002";
const DATE = "2026-09-23T00:00:00.000Z";

function imageFile(type = "image/jpeg", size = 3) {
  return new File([new Uint8Array(size)], "specimen.jpg", { type });
}

describe("specimen media form validation", () => {
  it("normalizes metadata and treats an empty caption as an explicit clear", () => {
    const formData = new FormData();
    formData.set("caption", "   ");
    formData.set("displayOrder", "12");

    const parsed = readSpecimenMediaMetadataForm(formData);
    expect(parsed.result.success).toBe(true);
    if (parsed.result.success) {
      expect(parsed.result.data).toEqual({ caption: null, displayOrder: 12 });
    }
  });

  it("accepts supported images and allowlists only backend-editable upload fields", () => {
    const formData = new FormData();
    formData.set("file", imageFile("image/webp"));
    formData.set("caption", "  Dorsal view  ");
    formData.set("displayOrder", "0");
    formData.set("isCover", "true");
    formData.set("storagePath", "attacker-controlled");
    formData.set("specimenId", "attacker-controlled");

    const parsed = readSpecimenMediaUploadForm(formData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        caption: "Dorsal view",
        displayOrder: 0,
        isCover: true,
      });
      expect(toSpecimenMediaUploadFormData(parsed.data).has("storagePath")).toBe(false);
    }
  });

  it("rejects unsupported, empty, oversized, and invalid-order uploads", () => {
    for (const [file, order] of [
      [imageFile("application/pdf"), "0"],
      [imageFile("image/png", 0), "0"],
      [imageFile("image/png", SPECIMEN_MEDIA_MAX_BYTES + 1), "0"],
      [imageFile(), "-1"],
      [imageFile(), "1.5"],
    ] as const) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("displayOrder", order);
      expect(readSpecimenMediaUploadForm(formData).success).toBe(false);
    }

    expect(readSpecimenMediaUploadForm(new FormData()).success).toBe(false);
  });
});

describe("specimen media response contracts", () => {
  const media = {
    id: MEDIA_ID,
    specimenId: SPECIMEN_ID,
    storagePath: `${SPECIMEN_ID}/private.jpg`,
    displayOrder: 0,
    caption: null,
    isCover: true,
    createdAt: DATE,
  };

  it("validates metadata, signed URLs, replacement cleanup, and removal cleanup", () => {
    expect(specimenMediaSchema.safeParse(media).success).toBe(true);
    expect(
      specimenMediaSignedUrlSchema.safeParse({
        mediaId: MEDIA_ID,
        signedUrl: "https://project.supabase.co/storage/v1/object/sign/private/token",
        expiresIn: 300,
      }).success,
    ).toBe(true);
    expect(
      replaceSpecimenMediaResultSchema.safeParse({
        media,
        previousStorageCleanupPending: false,
      }).success,
    ).toBe(true);
    expect(
      removeSpecimenMediaResultSchema.safeParse({
        id: MEDIA_ID,
        removed: true,
        storageCleanupPending: true,
      }).success,
    ).toBe(true);
  });
});
