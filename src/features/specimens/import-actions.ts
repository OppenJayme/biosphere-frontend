/** Authenticated Server Actions forming the browser/backend boundary for CSV import. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { commitSpecimenImport } from "./import-api";
import type { ImportActionResult, SpecimenImportCommit } from "./import-types";

const commitInputSchema = z.object({
  previewId: z.uuid(),
  rowNumbers: z.array(z.number().int().positive()).min(1).max(500),
});

function backendMessage(error: ApiError) {
  if (!error.body || typeof error.body !== "object") return null;
  const message = (error.body as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
  }
  return null;
}

function safeCommitError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return (
        backendMessage(error) ??
        "The selected rows could not be committed. Review the preview and try again."
      );
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to import specimen records.";
    if (error.status === 404) {
      return "This preview expired or is no longer available. Upload the CSV again.";
    }
    if (error.status === 429) return "Too many import requests were sent. Wait briefly and try again.";
  }
  return "The import could not be completed. Your reviewed preview is unchanged, so it is safe to retry.";
}

export async function commitSpecimenImportAction(input: {
  previewId: string;
  rowNumbers: number[];
}): Promise<ImportActionResult<SpecimenImportCommit>> {
  if (!(await verifySession())) redirect("/login?from=/cataloging/import");

  const parsed = commitInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Select at least one valid preview row before importing." };
  }

  // Sorting and deduplication keep retries deterministic without trusting client order.
  const rowNumbers = [...new Set(parsed.data.rowNumbers)].sort((a, b) => a - b);
  try {
    const data = await commitSpecimenImport(parsed.data.previewId, rowNumbers);
    revalidatePath("/cataloging");
    revalidatePath("/specimens");
    return { ok: true, data };
  } catch (error) {
    return { ok: false, message: safeCommitError(error) };
  }
}
