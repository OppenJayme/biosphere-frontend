/**
 * Cataloging-only validation for private specimen image uploads and metadata.
 * Storage paths, ownership, file signatures, and authorization remain backend-owned.
 */

import { z } from "zod";

export const SPECIMEN_MEDIA_MAX_BYTES = 15 * 1024 * 1024;
export const SPECIMEN_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp";
const POSTGRES_INTEGER_MAX = 2_147_483_647;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type MediaFormState = {
  values: { caption: string; displayOrder: string };
  errors?: Partial<Record<"caption" | "displayOrder", string[]>>;
  message?: string;
};

export type MediaCommandState = {
  message?: string;
};

function optionalDisplayOrder(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (!/^\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

const captionSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 255, "Captions must be 255 characters or fewer.");

const displayOrderSchema = z
  .string()
  .transform(optionalDisplayOrder)
  .refine(
    (value) =>
      value === undefined ||
      (Number.isSafeInteger(value) && value >= 0 && value <= POSTGRES_INTEGER_MAX),
    "Display order must be a whole number from 0 to 2147483647.",
  );

const mediaMetadataFormSchema = z.object({
  caption: captionSchema,
  displayOrder: displayOrderSchema,
});

export type SpecimenMediaMetadataInput = {
  caption: string | null;
  displayOrder?: number;
};

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

/** Allowlist editable metadata and convert an empty caption into an explicit clear. */
export function readSpecimenMediaMetadataForm(formData: FormData) {
  const values = {
    caption: formString(formData.get("caption")),
    displayOrder: formString(formData.get("displayOrder")),
  };
  const parsed = mediaMetadataFormSchema.safeParse(values);

  if (!parsed.success) return { values, result: parsed };

  const data: SpecimenMediaMetadataInput = {
    caption: parsed.data.caption || null,
    ...(parsed.data.displayOrder === undefined
      ? {}
      : { displayOrder: parsed.data.displayOrder }),
  };
  return {
    values,
    result: { success: true as const, data },
  };
}

export type MediaUploadInput = {
  file: File;
  caption?: string;
  displayOrder?: number;
  isCover: boolean;
};

function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    "name" in value &&
    typeof (value as File).arrayBuffer === "function"
  );
}

const mediaFileSchema = z
  .unknown()
  .superRefine((value, context) => {
    if (!isFile(value)) {
      context.addIssue({ code: "custom", message: "Choose an image file." });
      return;
    }
    if (value.size === 0) {
      context.addIssue({ code: "custom", message: "Choose a non-empty image file." });
    }
    if (value.size > SPECIMEN_MEDIA_MAX_BYTES) {
      context.addIssue({ code: "custom", message: "The image must be 15 MB or smaller." });
    }
    if (!ALLOWED_IMAGE_TYPES.has(value.type.toLowerCase())) {
      context.addIssue({ code: "custom", message: "Use a JPEG, PNG, or WebP image." });
    }
  })
  .transform((value) => value as File);

const mediaUploadSchema = mediaMetadataFormSchema.extend({
  file: mediaFileSchema,
  isCover: z.boolean(),
});

/** Validate every multipart field again on the server-side upload boundary. */
export function readSpecimenMediaUploadForm(formData: FormData) {
  const values = {
    file: formData.get("file"),
    caption: formString(formData.get("caption")),
    displayOrder: formString(formData.get("displayOrder")),
    isCover: formData.get("isCover") === "true" || formData.get("isCover") === "on",
  };
  const parsed = mediaUploadSchema.safeParse(values);

  if (!parsed.success) return parsed;

  return {
    success: true as const,
    data: {
      file: parsed.data.file,
      ...(parsed.data.caption ? { caption: parsed.data.caption } : {}),
      ...(parsed.data.displayOrder === undefined
        ? {}
        : { displayOrder: parsed.data.displayOrder }),
      isCover: parsed.data.isCover,
    } satisfies MediaUploadInput,
  };
}

/** Build a minimal multipart payload; client-supplied IDs and storage paths are discarded. */
export function toSpecimenMediaUploadFormData(input: MediaUploadInput) {
  const formData = new FormData();
  formData.set("file", input.file);
  if (input.caption) formData.set("caption", input.caption);
  if (input.displayOrder !== undefined) {
    formData.set("displayOrder", String(input.displayOrder));
  }
  formData.set("isCover", String(input.isCover));
  return formData;
}

export function firstMediaFormError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the image and metadata before uploading.";
}
