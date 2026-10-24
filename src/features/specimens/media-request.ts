/** Client boundary for the remote metadata Server Action. */
import { unstable_rethrow } from "next/navigation";
import { updateSpecimenMediaAction } from "./media-actions";
import { readSpecimenMediaMetadataForm, type MediaFormState } from "./media-form";

export async function requestSpecimenMediaMetadataUpdate(
  specimenId: string,
  mediaId: string,
  previousState: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  // Capture raw submitted text before awaiting; do not revert to the old state.
  const { values } = readSpecimenMediaMetadataForm(formData);
  try {
    return await updateSpecimenMediaAction(specimenId, mediaId, previousState, formData);
  } catch (error) {
    // Success and expired-session redirects are framework control flow, not failures.
    unstable_rethrow(error);
    // A lost response does not prove whether a save committed. Never auto-retry.
    return {
      values,
      message: "The metadata save outcome could not be confirmed. Your edits are retained here. Check your connection and review the current saved metadata in another tab before retrying. No automatic retry was made.",
    };
  }
}
