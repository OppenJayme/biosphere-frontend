/** Client request boundary for the reviewed import's remote Server Action. */
import { commitSpecimenImportAction } from "./import-actions";
import type { ImportActionResult, SpecimenImportCommit } from "./import-types";

export async function requestSpecimenImportCommit(
  input: Parameters<typeof commitSpecimenImportAction>[0],
): Promise<ImportActionResult<SpecimenImportCommit>> {
  try {
    return await commitSpecimenImportAction(input);
  } catch {
    // Transport loss cannot establish whether the server committed the rows.
    // Leave state/retries with the caller; never issue another request here.
    return {
      ok: false,
      message: "The import outcome could not be confirmed. Your reviewed preview and selections are unchanged. Check your connection, then retry this same preview before starting a new import.",
    };
  }
}
