"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  changeExhibitStatus,
  createExhibit,
  getExhibitQrInfo,
  updateExhibit,
} from "./api";
import {
  createExhibitSchema,
  qrCodeInfoSchema,
  updateExhibitSchema,
  type QrCodeInfo,
} from "./types";

export type ExhibitFormState = {
  message?: string;
  success?: boolean;
};

function apiErrorMessage(error: unknown, operation: string) {
  if (error instanceof ApiError) {
    if (error.status === 400) return `Check the exhibit fields and current status before ${operation}.`;
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "Only curators can manage exhibits and QR codes.";
    if (error.status === 404) return "This exhibit or linked specimen no longer exists. Reload the list.";
    if (error.status === 409) return "That public slug is already in use. Choose another.";
  }
  return `The exhibit could not be ${operation}. Check your connection and try again.`;
}

async function requireExhibitSession() {
  if (!(await verifySession())) redirect("/login?from=/exhibits");
}

function refreshExhibitConsumers(slug?: string) {
  revalidatePath("/exhibits");
  if (slug) revalidatePath(`/exhibits/${slug}`);
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalFormString(formData: FormData, key: string) {
  return formString(formData, key) || undefined;
}

export async function createExhibitAction(
  _previousState: ExhibitFormState,
  formData: FormData,
): Promise<ExhibitFormState> {
  void _previousState;
  await requireExhibitSession();

  const parsed = createExhibitSchema.safeParse({
    specimenId: formString(formData, "specimenId"),
    publicSlug: formString(formData, "publicSlug"),
    publicDescription: optionalFormString(formData, "publicDescription"),
    interestingFacts: optionalFormString(formData, "interestingFacts"),
    distribution: optionalFormString(formData, "distribution"),
    diet: optionalFormString(formData, "diet"),
    layoutType: optionalFormString(formData, "layoutType"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the exhibit fields." };
  }

  let created;
  try {
    created = await createExhibit(parsed.data);
  } catch (error) {
    return { message: apiErrorMessage(error, "created") };
  }

  if (formString(formData, "publishNow") === "true") {
    try {
      await changeExhibitStatus(created.id, "publish");
    } catch (error) {
      refreshExhibitConsumers(created.publicSlug);
      return {
        success: true,
        message: `Draft saved, but publishing failed. ${apiErrorMessage(error, "published")}`,
      };
    }
  }

  refreshExhibitConsumers(created.publicSlug);
  return {
    success: true,
    message: formString(formData, "publishNow") === "true" ? "Exhibit created and published." : "Exhibit draft created.",
  };
}

export async function updateExhibitAction(
  exhibitId: string,
  _previousState: ExhibitFormState,
  formData: FormData,
): Promise<ExhibitFormState> {
  void _previousState;
  await requireExhibitSession();

  const safeId = z.uuid().safeParse(exhibitId);
  if (!safeId.success) return { message: "The exhibit ID is invalid. Reload and try again." };

  const parsed = updateExhibitSchema.safeParse({
    publicDescription: optionalFormString(formData, "publicDescription"),
    interestingFacts: optionalFormString(formData, "interestingFacts"),
    distribution: optionalFormString(formData, "distribution"),
    diet: optionalFormString(formData, "diet"),
    layoutType: optionalFormString(formData, "layoutType"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the exhibit fields." };
  }
  if (!Object.values(parsed.data).some((value) => value !== undefined)) {
    return { message: "Change at least one field before saving." };
  }

  try {
    const updated = await updateExhibit(safeId.data, parsed.data);
    refreshExhibitConsumers(updated.publicSlug);
    return { success: true, message: "Exhibit details saved." };
  } catch (error) {
    return { message: apiErrorMessage(error, "updated") };
  }
}

export async function changeExhibitStatusAction(
  exhibitId: string,
  command: "publish" | "unpublish",
): Promise<ExhibitFormState> {
  await requireExhibitSession();
  const parsed = z.object({ id: z.uuid(), command: z.enum(["publish", "unpublish"]) }).safeParse({
    id: exhibitId,
    command,
  });
  if (!parsed.success) return { message: "The exhibit status command is invalid. Reload and try again." };

  try {
    const updated = await changeExhibitStatus(parsed.data.id, parsed.data.command);
    refreshExhibitConsumers(updated.publicSlug);
    return { success: true };
  } catch (error) {
    return { message: apiErrorMessage(error, parsed.data.command === "publish" ? "published" : "unpublished") };
  }
}

export async function getExhibitQrInfoAction(
  exhibitId: string,
): Promise<{ info?: QrCodeInfo; message?: string }> {
  await requireExhibitSession();
  const safeId = z.uuid().safeParse(exhibitId);
  if (!safeId.success) return { message: "The exhibit ID is invalid. Reload and try again." };

  try {
    const info = await getExhibitQrInfo(safeId.data);
    const parsed = qrCodeInfoSchema.safeParse(info);
    if (!parsed.success) return { message: "The QR information could not be validated." };
    return { info: parsed.data };
  } catch (error) {
    return { message: apiErrorMessage(error, "loaded") };
  }
}
