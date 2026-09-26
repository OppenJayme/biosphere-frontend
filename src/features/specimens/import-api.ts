/** Server-only calls for previewing and committing reviewed specimen imports. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  specimenImportCommitSchema,
  specimenImportPreviewSchema,
  type SpecimenImportCommit,
  type SpecimenImportPreview,
} from "./import-types";

export async function previewSpecimenImport(file: File): Promise<SpecimenImportPreview> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await apiFetch<unknown>("/specimens/import/preview", {
    method: "POST",
    body: formData,
  });
  const parsed = specimenImportPreviewSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The backend returned an invalid specimen-import preview.");
  }
  return parsed.data;
}

export async function commitSpecimenImport(
  previewId: string,
  rowNumbers: number[],
): Promise<SpecimenImportCommit> {
  const response = await apiFetch<unknown>("/specimens/import/commit", {
    method: "POST",
    body: JSON.stringify({ previewId, rowNumbers }),
  });
  const parsed = specimenImportCommitSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The backend returned an invalid specimen-import result.");
  }
  return parsed.data;
}
