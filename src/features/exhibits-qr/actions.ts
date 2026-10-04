/** Authenticated Server Actions for curator QR exhibit management (SRS 4.12 curator side). */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { searchSpecimens } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  changeExhibitStatus,
  createExhibit,
  getExhibit,
  getPublicExhibit,
  listExhibits,
  removeExhibitMedia,
  replaceExhibitUrl,
  setExhibitAr,
  updateExhibit,
  updateExhibitMedia,
  type ExhibitLifecycleCommand,
  type UpdateExhibitMediaInput,
} from "./api";
import {
  backendMessage,
  readCreateExhibitForm,
  readReplaceUrlForm,
  readUpdateExhibitForm,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  type ExhibitCommandState,
  type ExhibitCreateValues,
  type ExhibitEditValues,
  type ExhibitFormState,
} from "./form";
import { sortExhibitMedia, type ExhibitMedia, type PublicExhibitMedia } from "./types";

type Operation = "create" | "update" | "replaceUrl" | "ar" | ExhibitLifecycleCommand | "media";

const FALLBACK_400: Record<Operation, string> = {
  create: "Only a Cataloged specimen approved for public display can have an exhibit.",
  update: "Change at least one exhibit field before saving.",
  replaceUrl: "Choose a different URL ending from the current one.",
  ar: "AR can only be turned on after a developer uploads an AR model for this exhibit.",
  publish: "This exhibit cannot be published. Its specimen must still be Cataloged and approved for public display.",
  unpublish: "Only a published exhibit can be unpublished.",
  disable: "This exhibit cannot be disabled in its current state.",
  archive: "This exhibit cannot be archived in its current state.",
  media: "The image change was rejected. Reload and try again.",
};

function exhibitError(error: unknown, operation: Operation) {
  if (error instanceof ApiError) {
    if (error.status === 400) return backendMessage(error.body) ?? FALLBACK_400[operation];
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to manage QR exhibits.";
    if (error.status === 404) {
      return operation === "create"
        ? "The selected specimen no longer exists. Search again."
        : "This exhibit no longer exists. Reload the list.";
    }
    if (error.status === 409) {
      // Slug conflicts name the slug; the other create conflict names the specimen by UUID.
      const message = backendMessage(error.body);
      if (message && /slug/i.test(message)) return message;
      return operation === "create"
        ? "This specimen already has an active exhibit. Choose another specimen."
        : "The URL is already in use. Choose a different URL ending.";
    }
  }
  return "The exhibit change could not be saved. Check your connection and try again.";
}

async function requireSession() {
  if (!(await verifySession())) redirect("/login?from=/exhibits");
}

function refreshExhibitConsumers(slugs: string[] = []) {
  revalidatePath("/exhibits");
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
  // Slugs are bound from the client, so only well-formed ones reach revalidatePath.
  for (const slug of slugs) {
    if (typeof slug === "string" && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug)) revalidatePath(`/exhibits/${slug}`);
  }
}

const idSchema = z.uuid();

/** Create state carries the new id so the workspace can select it. */
export type CreateExhibitState = ExhibitFormState<ExhibitCreateValues> & { exhibitId?: string };

/**
 * Creates an UNPUBLISHED exhibit. With `intent=publish` it is published right after; if that
 * second step fails the exhibit still exists, and the message says so.
 */
export async function createExhibitAction(
  _previousState: CreateExhibitState,
  formData: FormData,
): Promise<CreateExhibitState> {
  void _previousState;
  await requireSession();
  const parsed = readCreateExhibitForm(formData);
  if (!parsed.ok) {
    return { values: parsed.values, errors: parsed.errors, message: "Check the highlighted fields." };
  }

  let created;
  try {
    created = await createExhibit(parsed.input);
  } catch (error) {
    return { values: parsed.values, message: exhibitError(error, "create") };
  }

  if (formData.get("intent") === "publish") {
    try {
      await changeExhibitStatus(created.id, "publish");
    } catch (error) {
      refreshExhibitConsumers();
      return {
        values: parsed.values,
        ok: true,
        exhibitId: created.id,
        message: `The exhibit was saved as Unpublished, but publishing failed: ${exhibitError(error, "publish")}`,
      };
    }
  }

  refreshExhibitConsumers([created.publicSlug]);
  return {
    values: parsed.values,
    ok: true,
    exhibitId: created.id,
    message: formData.get("intent") === "publish" ? "Exhibit created and published." : "Exhibit saved as Unpublished.",
  };
}

export async function updateExhibitAction(
  exhibitId: string,
  publicSlug: string,
  _previousState: ExhibitFormState<ExhibitEditValues>,
  formData: FormData,
): Promise<ExhibitFormState<ExhibitEditValues>> {
  void _previousState;
  await requireSession();
  const parsed = readUpdateExhibitForm(formData);
  const id = idSchema.safeParse(exhibitId);
  if (!id.success) return { values: parsed.values, message: "The exhibit identifier is invalid. Reload and try again." };
  if (!parsed.ok) {
    return { values: parsed.values, errors: parsed.errors, message: "Check the highlighted fields." };
  }

  let updated;
  try {
    updated = await updateExhibit(id.data, parsed.input);
  } catch (error) {
    return { values: parsed.values, message: exhibitError(error, "update") };
  }

  refreshExhibitConsumers([publicSlug, updated.publicSlug]);
  return { values: parsed.values, ok: true, message: "Exhibit content saved." };
}

/** Intentionally moves the public page to a new URL; QR labels printed for the old one stop working. */
export async function replaceExhibitUrlAction(
  exhibitId: string,
  currentSlug: string,
  formData: FormData,
): Promise<ExhibitCommandState> {
  await requireSession();
  const id = idSchema.safeParse(exhibitId);
  if (!id.success) return { message: "The exhibit identifier is invalid. Reload and try again." };
  const parsed = readReplaceUrlForm(formData);
  if (!parsed.ok) return { message: parsed.message };
  if (parsed.publicSlug === currentSlug) return { message: FALLBACK_400.replaceUrl };

  let updated;
  try {
    updated = await replaceExhibitUrl(id.data, parsed.publicSlug);
  } catch (error) {
    return { message: exhibitError(error, "replaceUrl") };
  }

  refreshExhibitConsumers([currentSlug, updated.publicSlug]);
  return {
    ok: true,
    message: `The public URL now ends in /exhibits/${updated.publicSlug}. QR labels printed for the old URL no longer work; print new ones.`,
  };
}

/** Curator on/off switch for the AR models a developer uploaded (REQ-4.13-02). */
export async function setExhibitArAction(
  exhibitId: string,
  publicSlug: string,
  enabled: boolean,
): Promise<ExhibitCommandState> {
  await requireSession();
  const parsed = z.object({ id: idSchema, enabled: z.boolean() }).safeParse({ id: exhibitId, enabled });
  if (!parsed.success) return { message: "The AR change is invalid. Reload and try again." };

  try {
    await setExhibitAr(parsed.data.id, parsed.data.enabled);
  } catch (error) {
    return { message: exhibitError(error, "ar") };
  }

  refreshExhibitConsumers([publicSlug]);
  return {
    ok: true,
    message: parsed.data.enabled
      ? "AR turned on. Visitors with a supported device now see View in AR."
      : "AR turned off. The public page no longer offers View in AR.",
  };
}

const LIFECYCLE_MESSAGES: Record<ExhibitLifecycleCommand, string> = {
  publish: "Exhibit published. Its public page is now live.",
  unpublish: "Exhibit unpublished. Its public page is offline until you publish it again.",
  disable: "Exhibit disabled. Its public page is no longer available and cannot be published again.",
  archive: "Exhibit archived.",
};

export async function changeExhibitStatusAction(
  exhibitId: string,
  publicSlug: string,
  command: ExhibitLifecycleCommand,
): Promise<ExhibitCommandState> {
  await requireSession();
  const parsed = z
    .object({ id: idSchema, command: z.enum(["publish", "unpublish", "disable", "archive"]) })
    .safeParse({ id: exhibitId, command });
  if (!parsed.success) return { message: "The exhibit command is invalid. Reload and try again." };

  try {
    await changeExhibitStatus(parsed.data.id, parsed.data.command);
  } catch (error) {
    return { message: exhibitError(error, parsed.data.command) };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: LIFECYCLE_MESSAGES[parsed.data.command] };
}

export async function removeExhibitMediaAction(
  exhibitId: string,
  mediaId: string,
  publicSlug: string,
): Promise<ExhibitCommandState> {
  await requireSession();
  const ids = z.object({ exhibitId: idSchema, mediaId: idSchema }).safeParse({ exhibitId, mediaId });
  if (!ids.success) return { message: "The image identifier is invalid. Reload and try again." };

  try {
    await removeExhibitMedia(ids.data.exhibitId, ids.data.mediaId);
  } catch (error) {
    return { message: exhibitError(error, "media") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: "Image removed." };
}

/** Edits one image's caption, display order, or cover flag. */
export async function updateExhibitMediaAction(
  exhibitId: string,
  mediaId: string,
  publicSlug: string,
  input: UpdateExhibitMediaInput,
): Promise<ExhibitCommandState> {
  await requireSession();
  const parsed = z
    .object({
      exhibitId: idSchema,
      mediaId: idSchema,
      input: z
        .object({
          caption: z.string().trim().max(255, "Captions must be 255 characters or fewer.").nullable().optional(),
          displayOrder: z.number().int().min(0).max(2_147_483_647).optional(),
          isCover: z.boolean().optional(),
        })
        .strict(),
    })
    .safeParse({ exhibitId, mediaId, input });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "The image change is invalid." };

  const { caption, ...rest } = parsed.data.input;
  const body: UpdateExhibitMediaInput = { ...rest, ...(caption === undefined ? {} : { caption: caption || null }) };
  if (Object.keys(body).length === 0) return { message: "Change the caption, order, or cover before saving." };

  try {
    await updateExhibitMedia(parsed.data.exhibitId, parsed.data.mediaId, body);
  } catch (error) {
    return { message: exhibitError(error, "media") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: body.isCover ? "Cover photo updated." : "Image details saved." };
}

export type ExhibitMediaResult = {
  /** Media records (storage paths only; the curator API has no viewable image links). */
  media: ExhibitMedia[];
  /** Short-lived viewable links from the public page, only while the exhibit is published. */
  previews: PublicExhibitMedia[];
  message?: string;
};

/** Loads an exhibit's media for the detail panel and the edit dialog. */
export async function loadExhibitMediaAction(exhibitId: string): Promise<ExhibitMediaResult> {
  if (!(await verifySession())) return { media: [], previews: [], message: "Your session expired. Sign in and try again." };
  const id = idSchema.safeParse(exhibitId);
  if (!id.success) return { media: [], previews: [], message: "The exhibit identifier is invalid." };

  try {
    const exhibit = await getExhibit(id.data);
    const media = sortExhibitMedia(exhibit.media ?? []);
    if (exhibit.status !== "PUBLISHED" || media.length === 0) return { media, previews: [] };
    const publicPage = await getPublicExhibit(exhibit.publicSlug).catch(() => null);
    return { media, previews: sortExhibitMedia(publicPage?.media ?? []) };
  } catch (error) {
    return { media: [], previews: [], message: exhibitError(error, "media") };
  }
}

export type EligibleSpecimen = {
  id: string;
  commonName: string | null;
  scientificName: string | null;
  accessionNumber: string | null;
};

export type EligibleSpecimenResult = { items: EligibleSpecimen[]; message?: string };

/**
 * Specimens that can back a new exhibit (REQ-4.12-02, BR-20): Cataloged, approved for public
 * display, and not already linked to an active exhibit. The backend re-checks all three on create.
 */
export async function searchEligibleSpecimensAction(search: string): Promise<EligibleSpecimenResult> {
  if (!(await verifySession())) return { items: [], message: "Your session expired. Sign in and try again." };
  const term = typeof search === "string" ? search.trim().slice(0, 100) : "";

  try {
    const [page, exhibits] = await Promise.all([
      searchSpecimens({
        search: term,
        status: "CATALOGED",
        collectionId: null,
        specimenCategory: "",
        gender: null,
        publicDisplay: true,
        sortBy: "updatedAt",
        sortDirection: "desc",
        page: 1,
      }),
      listExhibits(),
    ]);
    const taken = new Set(exhibits.map((exhibit) => exhibit.specimenId));
    return {
      items: page.items
        .filter((specimen) => !taken.has(specimen.id))
        .map(({ id, commonName, scientificName, accessionNumber }) => ({
          id,
          commonName,
          scientificName,
          accessionNumber,
        })),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { items: [], message: "Your session expired. Sign in and try again." };
    }
    return { items: [], message: "Specimens could not be searched. Check the backend connection and try again." };
  }
}
