/**
 * Curator-side validation for exhibit content, public URLs, and image metadata.
 * The backend re-checks everything (eligibility, slug reservations, lifecycle); these rules only
 * give the curator an early, specific message.
 */

import { z } from "zod";
import {
  EXHIBIT_LAYOUTS,
  EXHIBIT_STATUSES,
  type ExhibitLayout,
  type ExhibitListQuery,
} from "./types";

export const EXHIBIT_MEDIA_MAX_BYTES = 15 * 1024 * 1024;
export const EXHIBIT_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const POSTGRES_INTEGER_MAX = 2_147_483_647;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 255;

/** Suggests a public URL segment from a specimen name: "Mountain Gorilla" -> "mountain-gorilla". */
export function suggestSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

const slugSchema = z
  .string()
  .trim()
  .min(1, "Enter the public URL ending.")
  .max(SLUG_MAX_LENGTH, `The public URL ending must be ${SLUG_MAX_LENGTH} characters or fewer.`)
  .regex(SLUG_PATTERN, "Use lowercase letters and numbers separated by single hyphens, e.g. mountain-gorilla.");

function optionalText(max?: number, label = "This field") {
  const base = z.string().transform((value) => value.trim());
  return max
    ? base.refine((value) => value.length <= max, `${label} must be ${max} characters or fewer.`)
    : base;
}

const contentShape = {
  publicDescription: optionalText(),
  interestingFacts: optionalText(),
  distribution: optionalText(255, "Distribution"),
  diet: optionalText(255, "Diet"),
  layoutType: z.enum(EXHIBIT_LAYOUTS, "Choose a public page layout."),
};

const createSchema = z.object({
  specimenId: z.uuid("Select a Cataloged specimen approved for public display."),
  publicSlug: slugSchema,
  ...contentShape,
});

const updateSchema = z.object({ ...contentShape, originalLayout: z.string() });

export const EXHIBIT_CONTENT_FIELDS = [
  "publicDescription",
  "interestingFacts",
  "distribution",
  "diet",
  "layoutType",
] as const;
type ContentField = (typeof EXHIBIT_CONTENT_FIELDS)[number];

export type ExhibitContentValues = Record<ContentField, string>;
export type ExhibitEditValues = ExhibitContentValues & { publicSlug: string };
export type ExhibitCreateValues = ExhibitContentValues & { specimenId: string; publicSlug: string };

export type ExhibitFormState<Values> = {
  values: Values;
  /** Set when the change was saved and the form stays on screen (no redirect). */
  ok?: boolean;
  errors?: Partial<Record<keyof Values, string>>;
  message?: string;
};

export type ExhibitCommandState = { ok?: boolean; message?: string };

export type CreateExhibitInput = {
  specimenId: string;
  publicSlug: string;
  layoutType: ExhibitLayout;
  publicDescription?: string;
  interestingFacts?: string;
  distribution?: string;
  diet?: string;
};

export type UpdateExhibitInput = {
  publicDescription: string | null;
  interestingFacts: string | null;
  distribution: string | null;
  diet: string | null;
  layoutType?: ExhibitLayout;
  publicSlug?: string;
};

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function firstErrors<Values>(error: z.ZodError) {
  const errors: Partial<Record<keyof Values, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof Values;
    if (key !== undefined && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function readContentValues(formData: FormData): ExhibitContentValues {
  return {
    publicDescription: formString(formData, "publicDescription"),
    interestingFacts: formString(formData, "interestingFacts"),
    distribution: formString(formData, "distribution"),
    diet: formString(formData, "diet"),
    layoutType: formString(formData, "layoutType"),
  };
}

/** Blank optional fields are left out on create: the backend rejects empty strings. */
export function readCreateExhibitForm(formData: FormData) {
  const values: ExhibitCreateValues = {
    specimenId: formString(formData, "specimenId"),
    publicSlug: formString(formData, "publicSlug"),
    ...readContentValues(formData),
  };
  const parsed = createSchema.safeParse(values);
  if (!parsed.success) {
    return { values, ok: false as const, errors: firstErrors<ExhibitCreateValues>(parsed.error) };
  }

  const { specimenId, publicSlug, layoutType, ...content } = parsed.data;
  const input: CreateExhibitInput = { specimenId, publicSlug, layoutType };
  for (const [key, value] of Object.entries(content) as [keyof typeof content, string][]) {
    if (value) input[key] = value;
  }
  return { values, ok: true as const, input };
}

/**
 * Blank fields become an explicit null so the curator can remove a section from the public page.
 * The layout and URL ending are only sent when the curator changed them, so older stored values
 * are kept otherwise.
 */
export function readUpdateExhibitForm(formData: FormData) {
  const values: ExhibitEditValues = { ...readContentValues(formData), publicSlug: formString(formData, "publicSlug") };
  const parsed = updateSchema.safeParse({ ...values, originalLayout: formString(formData, "originalLayout") });
  const originalSlug = formString(formData, "originalSlug");
  const slugChanged = formData.has("publicSlug") && values.publicSlug.trim() !== originalSlug;
  const slug = slugChanged ? slugSchema.safeParse(values.publicSlug) : null;

  if (!parsed.success || (slug && !slug.success)) {
    const errors = parsed.success ? {} : firstErrors<ExhibitEditValues>(parsed.error);
    if (slug && !slug.success) errors.publicSlug = slug.error.issues[0]?.message;
    return { values, ok: false as const, errors };
  }

  const { originalLayout, layoutType, ...content } = parsed.data;
  const input: UpdateExhibitInput = {
    publicDescription: content.publicDescription || null,
    interestingFacts: content.interestingFacts || null,
    distribution: content.distribution || null,
    diet: content.diet || null,
    ...(layoutType === originalLayout ? {} : { layoutType }),
    ...(slug?.success ? { publicSlug: slug.data } : {}),
  };
  return { values, ok: true as const, input };
}

export function readReplaceUrlForm(formData: FormData) {
  const values = { publicSlug: formString(formData, "publicSlug") };
  const parsed = slugSchema.safeParse(values.publicSlug);
  return parsed.success
    ? { values, ok: true as const, publicSlug: parsed.data }
    : { values, ok: false as const, message: parsed.error.issues[0]?.message ?? "Enter a valid URL ending." };
}

export type MediaMetadataInput = { caption: string | null; displayOrder?: number };

const captionSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 255, "Captions must be 255 characters or fewer.");

const displayOrderSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "Display order must be a whole number (0 or more).")
  .transform((value) => (value === "" ? undefined : Number(value)))
  .refine(
    (value) => value === undefined || value <= POSTGRES_INTEGER_MAX,
    "Display order is too large.",
  );

export function readMediaMetadataForm(formData: FormData) {
  const parsed = z
    .object({ caption: captionSchema, displayOrder: displayOrderSchema })
    .safeParse({ caption: formString(formData, "caption"), displayOrder: formString(formData, "displayOrder") });
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the image details." };
  }
  const input: MediaMetadataInput = {
    caption: parsed.data.caption || null,
    ...(parsed.data.displayOrder === undefined ? {} : { displayOrder: parsed.data.displayOrder }),
  };
  return { ok: true as const, input };
}

/** Checks an upload before it is sent; the backend re-validates the file signature. */
export function exhibitImageError(file: unknown): string | null {
  if (!(file instanceof File) || file.size === 0) return "Choose a non-empty image file.";
  if (file.size > EXHIBIT_MEDIA_MAX_BYTES) return "The image must be 15 MB or smaller.";
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) return "Use a JPEG, PNG, or WebP image.";
  return null;
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Allowlists the curator list filters from the URL. */
export function parseExhibitListQuery(params: SearchParams): ExhibitListQuery {
  const status = firstValue(params.status).toUpperCase();
  const ar = firstValue(params.ar);
  return {
    status: (EXHIBIT_STATUSES as readonly string[]).includes(status) ? (status as ExhibitListQuery["status"]) : "",
    ar: ar === "on" || ar === "off" ? ar : "",
    search: firstValue(params.search).trim().slice(0, 100),
  };
}

export function exhibitsHref(query: ExhibitListQuery, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status.toLowerCase());
  if (query.ar) params.set("ar", query.ar);
  if (query.search) params.set("search", query.search);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const search = params.toString();
  return search ? `/exhibits?${search}` : "/exhibits";
}

/**
 * Backend messages for 400/409 name the unmet requirement (SRS 4.12.2), so they are shown as-is,
 * unless they carry a raw identifier a curator cannot act on.
 */
export function backendMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const raw = (body as { message: unknown }).message;
  const message = Array.isArray(raw) ? raw.find((item) => typeof item === "string") : raw;
  if (typeof message !== "string" || !message.trim()) return null;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(message)) return null;
  return message;
}
