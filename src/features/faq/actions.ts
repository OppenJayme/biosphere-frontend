/** Authenticated Server Actions for the curator-controlled FAQ lifecycle. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { changeFaqStatus, createFaqEntry, updateFaqEntry } from "./api";
import {
  firstFaqValidationMessage,
  readFaqForm,
  type FaqCommandState,
  type FaqFormState,
} from "./management";

type FaqOperation = "create" | "update" | "activate" | "deactivate" | "archive";

function faqError(error: unknown, operation: FaqOperation) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      if (operation === "update") return "Change at least one valid knowledge field before saving.";
      if (operation === "archive") return "This FAQ knowledge entry cannot be archived in its current state.";
      if (operation === "activate" || operation === "deactivate") {
        return "Archived FAQ knowledge cannot change lifecycle status.";
      }
      return "Check the required question, approved answer, lists, and category.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to manage FAQ knowledge.";
    if (error.status === 404) return "This FAQ knowledge entry no longer exists. Reload the list.";
    if (error.status === 409) return "The FAQ entry changed at the same time. Reload and try again.";
  }
  return "The FAQ knowledge change could not be saved. Check your connection and try again.";
}

async function requireFaqSession() {
  if (!(await verifySession())) redirect("/login?from=/faq-knowledge");
}

function refreshFaqConsumers() {
  revalidatePath("/faq-knowledge");
  revalidatePath("/audit-logs");
  revalidatePath("/dashboard");
}

export async function createFaqEntryAction(
  _previousState: FaqFormState,
  formData: FormData,
): Promise<FaqFormState> {
  void _previousState;
  await requireFaqSession();
  const parsed = readFaqForm(formData);
  if (!parsed.result.success) {
    return { values: parsed.values, message: firstFaqValidationMessage(parsed.result.error) };
  }

  let created;
  try {
    created = await createFaqEntry(parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: faqError(error, "create") };
  }

  refreshFaqConsumers();
  redirect(`/faq-knowledge?selected=${created.id}&notice=created`);
}

export async function updateFaqEntryAction(
  entryId: string,
  _previousState: FaqFormState,
  formData: FormData,
): Promise<FaqFormState> {
  void _previousState;
  await requireFaqSession();
  const parsed = readFaqForm(formData);
  const safeId = z.uuid().safeParse(entryId);
  if (!safeId.success) {
    return { values: parsed.values, message: "The FAQ identifier is invalid. Reload and try again." };
  }
  if (!parsed.result.success) {
    return { values: parsed.values, message: firstFaqValidationMessage(parsed.result.error) };
  }

  try {
    await updateFaqEntry(safeId.data, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: faqError(error, "update") };
  }

  refreshFaqConsumers();
  redirect(`/faq-knowledge?selected=${safeId.data}&notice=updated`);
}

export async function changeFaqStatusAction(
  entryId: string,
  command: "activate" | "deactivate" | "archive",
  _previousState: FaqCommandState,
  _formData: FormData,
): Promise<FaqCommandState> {
  void _previousState;
  void _formData;
  await requireFaqSession();
  const parsed = z
    .object({ id: z.uuid(), command: z.enum(["activate", "deactivate", "archive"]) })
    .safeParse({ id: entryId, command });
  if (!parsed.success) return { message: "The FAQ lifecycle command is invalid. Reload and try again." };

  try {
    await changeFaqStatus(parsed.data.id, parsed.data.command);
  } catch (error) {
    return { message: faqError(error, parsed.data.command) };
  }

  refreshFaqConsumers();
  redirect(`/faq-knowledge?selected=${parsed.data.id}&notice=${parsed.data.command}d`);
}
