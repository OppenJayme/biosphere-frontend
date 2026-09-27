/**
 * Curator-facing messages for failed specimen mutations.
 * Kept free of server-only imports so the status mappings can be unit tested;
 * server actions pass the ApiError (or null for network failures) in.
 */

import { catalogedEditGuardMessage } from "./lifecycle";

export type MutationMode = "create" | "update";

/** Minimal shape of a backend ApiError that these mappings read. */
export type MutationFailure = { status: number; body: unknown } | null;

/**
 * The backend runs catalog-sensitive edits under SERIALIZABLE isolation and returns 409
 * when a concurrent change to the same specimen wins; retrying after a reload is safe.
 */
export function concurrentChangeMessage(retryVerb: string) {
  return `The specimen changed at the same time. Reload before ${retryVerb} again.`;
}

export function specimenCoreErrorMessage(failure: MutationFailure, mode: MutationMode) {
  if (failure) {
    if (failure.status === 400) {
      // Cataloged records reject clearing a required field; say which one and how to proceed.
      const guard = catalogedEditGuardMessage(failure.body);
      if (guard) return guard;
      return mode === "update"
        ? "No changes were saved. Change at least one core field and check the entered values."
        : "The draft could not be saved. Check the entered values and try again.";
    }
    if (failure.status === 401) return "Your session expired. Sign in and try again.";
    if (failure.status === 403) return "You do not have permission to change specimen records.";
    if (failure.status === 404) {
      return "The specimen or selected collection no longer exists. Reload and try again.";
    }
    if (failure.status === 409) {
      return mode === "update"
        ? concurrentChangeMessage("saving")
        : "The specimen could not be saved because it conflicts with an existing record.";
    }
  }

  return "The specimen could not be saved right now. Check your connection and try again.";
}

export function taxonomyErrorMessage(failure: MutationFailure, mode: MutationMode) {
  if (failure) {
    if (failure.status === 400) {
      const guard = catalogedEditGuardMessage(failure.body);
      if (guard) return guard;
      return mode === "create"
        ? "Enter at least one valid taxonomy value before saving."
        : "No changes were saved. Change at least one taxonomy field and try again.";
    }
    if (failure.status === 401) return "Your session expired. Sign in and try again.";
    if (failure.status === 403) return "You do not have permission to change taxonomy records.";
    if (failure.status === 404) {
      return "The specimen or taxonomy record no longer exists. Reload and try again.";
    }
    if (failure.status === 409) {
      return mode === "update"
        ? concurrentChangeMessage("saving")
        : "A taxonomy record was already created for this specimen. Reload before editing it.";
    }
  }

  return "The taxonomy record could not be saved. Check your connection and try again.";
}

export function provenanceErrorMessage(failure: MutationFailure, mode: MutationMode) {
  if (failure) {
    if (failure.status === 400) {
      const guard = catalogedEditGuardMessage(failure.body);
      if (guard) return guard;
      return mode === "create"
        ? "Enter at least one valid provenance or preservation value before saving."
        : "No changes were saved. Change at least one provenance field and try again.";
    }
    if (failure.status === 401) return "Your session expired. Sign in and try again.";
    if (failure.status === 403) return "You do not have permission to change provenance records.";
    if (failure.status === 404) {
      return "The specimen or provenance record no longer exists. Reload and try again.";
    }
    if (failure.status === 409) {
      return mode === "update"
        ? concurrentChangeMessage("saving")
        : "A provenance record was already created for this specimen. Reload before editing it.";
    }
  }

  return "The provenance record could not be saved. Check your connection and try again.";
}
