/** Authenticated Server Actions for curator QR exhibit management (SRS 4.12, 4.13 curator side). */

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
  listExhibits,
  removeExhibitMedia,
  replaceExhibitUrl,
  setExhibitAr,
  updateExhibit,
  updateExhibitMedia,
  type ExhibitLifecycleCommand,
} from "./api";
import {
  backendMessage,
  exhibitsHref,
  parseExhibitListQuery,
  readCreateExhibitForm,
  readMediaMetadataForm,
  readReplaceUrlForm,
  readUpdateExhibitForm,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  type ExhibitCommandState,
  type ExhibitContentValues,
  type ExhibitCreateValues,
  type ExhibitFormState,
} from "./form";
import type { ExhibitListQuery } from "./types";

type Operation =
  | "create"
  | "update"
  | "replace-url"
  | ExhibitLifecycleCommand
  | "ar-on"
  | "ar-off"
  | "media";

const FALLBACK_400: Record<Operation, string> = {
  create: "Only a Cataloged specimen approved for public display can have an exhibit.",
  update: "Change at least one exhibit field before saving.",
  "replace-url": "This URL cannot be used. Choose a different URL ending.",
  publish: "This exhibit cannot be published. Its specimen must still be Cataloged and approved for public display.",
  unpublish: "Only a published exhibit can be unpublished.",
  disable: "Only a published exhibit can be disabled.",
  archive: "This exhibit cannot be archived in its current state.",
  "ar-on": "No AR model has been uploaded for this exhibit yet. A developer must upload one first.",
  "ar-off": "AR could not be turned off for this exhibit.",
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
  revalidatePath("/audit-logs");
  // Slugs are bound from the client, so only well-formed ones reach revalidatePath.
  for (const slug of slugs) {
    if (typeof slug === "string" && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug)) revalidatePath(`/exhibits/${slug}`);
  }
}

/** Re-parses the bound list query so a tampered value can't reach the redirect. */
function returnHref(query: ExhibitListQuery, extra: Record<string, string>) {
  return exhibitsHref(
    parseExhibitListQuery({
      status: query?.status ?? "",
      ar: query?.ar ?? "",
      search: query?.search ?? "",
    }),
    extra,
  );
}

const idSchema = z.uuid();

export async function createExhibitAction(
  query: ExhibitListQuery,
  _previousState: ExhibitFormState<ExhibitCreateValues>,
  formData: FormData,
): Promise<ExhibitFormState<ExhibitCreateValues>> {
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

  refreshExhibitConsumers();
  redirect(returnHref(query, { selected: created.id, notice: "created" }));
}

export async function updateExhibitAction(
  exhibitId: string,
  publicSlug: string,
  _previousState: ExhibitFormState<ExhibitContentValues>,
  formData: FormData,
): Promise<ExhibitFormState<ExhibitContentValues>> {
  void _previousState;
  await requireSession();
  const parsed = readUpdateExhibitForm(formData);
  const id = idSchema.safeParse(exhibitId);
  if (!id.success) return { values: parsed.values, message: "The exhibit identifier is invalid. Reload and try again." };
  if (!parsed.ok) {
    return { values: parsed.values, errors: parsed.errors, message: "Check the highlighted fields." };
  }

  try {
    await updateExhibit(id.data, parsed.input);
  } catch (error) {
    return { values: parsed.values, message: exhibitError(error, "update") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { values: parsed.values, ok: true, message: "Exhibit content saved." };
}

export async function replaceExhibitUrlAction(
  exhibitId: string,
  previousSlug: string,
  _previousState: ExhibitFormState<{ publicSlug: string }>,
  formData: FormData,
): Promise<ExhibitFormState<{ publicSlug: string }>> {
  void _previousState;
  await requireSession();
  const parsed = readReplaceUrlForm(formData);
  const id = idSchema.safeParse(exhibitId);
  if (!id.success) return { values: parsed.values, message: "The exhibit identifier is invalid. Reload and try again." };
  if (!parsed.ok) return { values: parsed.values, message: parsed.message };

  try {
    await replaceExhibitUrl(id.data, parsed.publicSlug);
  } catch (error) {
    return { values: parsed.values, message: exhibitError(error, "replace-url") };
  }

  refreshExhibitConsumers([previousSlug, parsed.publicSlug]);
  return {
    values: { publicSlug: "" },
    ok: true,
    message: `The public URL now ends in /exhibits/${parsed.publicSlug}. Download and print the new QR label.`,
  };
}

const LIFECYCLE_NOTICES: Record<ExhibitLifecycleCommand, string> = {
  publish: "published",
  unpublish: "unpublished",
  disable: "disabled",
  archive: "archived",
};

export async function changeExhibitStatusAction(
  exhibitId: string,
  publicSlug: string,
  command: ExhibitLifecycleCommand,
  query: ExhibitListQuery,
  _previousState: ExhibitCommandState,
  _formData: FormData,
): Promise<ExhibitCommandState> {
  void _previousState;
  void _formData;
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
  const notice = LIFECYCLE_NOTICES[parsed.data.command];
  redirect(
    returnHref(query, parsed.data.command === "archive" ? { notice } : { selected: parsed.data.id, notice }),
  );
}

export async function setExhibitArAction(
  exhibitId: string,
  publicSlug: string,
  enabled: boolean,
  query: ExhibitListQuery,
  _previousState: ExhibitCommandState,
  _formData: FormData,
): Promise<ExhibitCommandState> {
  void _previousState;
  void _formData;
  await requireSession();
  const id = idSchema.safeParse(exhibitId);
  if (!id.success || typeof enabled !== "boolean") {
    return { message: "The AR command is invalid. Reload and try again." };
  }

  try {
    await setExhibitAr(id.data, enabled);
  } catch (error) {
    return { message: exhibitError(error, enabled ? "ar-on" : "ar-off") };
  }

  refreshExhibitConsumers([publicSlug]);
  redirect(returnHref(query, { selected: id.data, notice: enabled ? "ar-on" : "ar-off" }));
}

function parseMediaIds(exhibitId: string, mediaId: string) {
  return z.object({ exhibitId: idSchema, mediaId: idSchema }).safeParse({ exhibitId, mediaId });
}

export async function updateExhibitMediaAction(
  exhibitId: string,
  mediaId: string,
  publicSlug: string,
  _previousState: ExhibitCommandState,
  formData: FormData,
): Promise<ExhibitCommandState> {
  void _previousState;
  await requireSession();
  const ids = parseMediaIds(exhibitId, mediaId);
  if (!ids.success) return { message: "The image identifier is invalid. Reload and try again." };
  const parsed = readMediaMetadataForm(formData);
  if (!parsed.ok) return { message: parsed.message };

  try {
    await updateExhibitMedia(ids.data.exhibitId, ids.data.mediaId, parsed.input);
  } catch (error) {
    return { message: exhibitError(error, "media") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: "Image details saved." };
}

export async function setExhibitCoverAction(
  exhibitId: string,
  mediaId: string,
  publicSlug: string,
  _previousState: ExhibitCommandState,
  _formData: FormData,
): Promise<ExhibitCommandState> {
  void _previousState;
  void _formData;
  await requireSession();
  const ids = parseMediaIds(exhibitId, mediaId);
  if (!ids.success) return { message: "The image identifier is invalid. Reload and try again." };

  try {
    await updateExhibitMedia(ids.data.exhibitId, ids.data.mediaId, { isCover: true });
  } catch (error) {
    return { message: exhibitError(error, "media") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: "Cover image changed." };
}

export async function removeExhibitMediaAction(
  exhibitId: string,
  mediaId: string,
  publicSlug: string,
  _previousState: ExhibitCommandState,
  _formData: FormData,
): Promise<ExhibitCommandState> {
  void _previousState;
  void _formData;
  await requireSession();
  const ids = parseMediaIds(exhibitId, mediaId);
  if (!ids.success) return { message: "The image identifier is invalid. Reload and try again." };

  try {
    await removeExhibitMedia(ids.data.exhibitId, ids.data.mediaId);
  } catch (error) {
    return { message: exhibitError(error, "media") };
  }

  refreshExhibitConsumers([publicSlug]);
  return { ok: true, message: "Image removed." };
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
