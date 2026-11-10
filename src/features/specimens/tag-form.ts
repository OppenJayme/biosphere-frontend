/**
 * Cataloging-only validation for reusable specimen tags and vocabulary searches.
 * It mirrors the backend naming rules without owning tag persistence or authorization.
 */

import { z } from "zod";

export const TAG_FORM_FIELDS = ["tagName"] as const;
export type TagFormField = (typeof TAG_FORM_FIELDS)[number];

export type TagFormState = {
  values: { tagName: string };
  errors?: Partial<Record<TagFormField, string[]>>;
  message?: string;
};

export type DetachTagState = {
  message?: string;
};

const TAG_NAME_PATTERN = /^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u;

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

// Normalize before validating so the frontend and NestJS accept the same tag spelling.
export const tagNameSchema = z
  .string()
  .transform(normalizeTagName)
  .pipe(
    z
      .string()
      .min(1, "Enter a tag name.")
      .max(100, "Tag names must be 100 characters or fewer.")
      .regex(TAG_NAME_PATTERN, "Tag names cannot contain control characters."),
  );

export const attachSpecimenTagFormSchema = z.object({
  tagName: tagNameSchema,
});

export type AttachSpecimenTagInput = z.output<typeof attachSpecimenTagFormSchema>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

/** Allowlist the only writable tag field before sending it to the backend. */
export function readAttachSpecimenTagForm(formData: FormData) {
  const values = { tagName: formString(formData.get("tagName")) };
  return {
    values,
    result: attachSpecimenTagFormSchema.safeParse(values),
  };
}

/** Normalize a GET search safely; invalid control characters produce no search term. */
export function parseTagSearch(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return "";

  const parsed = tagNameSchema.safeParse(first);
  return parsed.success ? parsed.data : "";
}
