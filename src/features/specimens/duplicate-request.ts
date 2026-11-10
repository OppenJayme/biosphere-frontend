/** Client-side duplicate lookup boundary; transport can fail before a Server Action returns. */
import { checkSpecimenDuplicatesAction } from "./actions";
import type { DuplicateCheckInput, DuplicateCheckState } from "./duplicates";

export async function requestSpecimenDuplicateCheck(input: DuplicateCheckInput): Promise<DuplicateCheckState> {
  try {
    return await checkSpecimenDuplicatesAction(input);
  } catch {
    // A failed transport is unknown, not a clean result or a failed specimen save.
    return { status: "unavailable" };
  }
}
