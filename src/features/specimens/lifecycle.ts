/**
 * Presentation rules for Cataloging lifecycle controls.
 * NestJS remains authoritative for status, active-lot checks, and every mutation.
 */

import type { SpecimenSummary } from "./types";

type LifecycleSpecimen = Pick<SpecimenSummary, "status" | "publicDisplay">;

export function publicDisplayCommand(specimen: LifecycleSpecimen) {
  if (specimen.status !== "CATALOGED") return null;

  return {
    nextValue: !specimen.publicDisplay,
    label: specimen.publicDisplay ? "Remove public eligibility" : "Mark publicly eligible",
    question: specimen.publicDisplay ? "Remove public eligibility?" : "Mark as publicly eligible?",
    confirmLabel: specimen.publicDisplay ? "Yes, remove" : "Yes, mark eligible",
    detail: specimen.publicDisplay
      ? "Its Cataloged status does not change."
      : "This does not publish an exhibit or expose the internal record.",
  };
}

/** Return a visible reason instead of offering an operation the backend must reject. */
export function archiveBlockReason(status: SpecimenSummary["status"], activeLotCount: number) {
  if (status === "ARCHIVED") return "This specimen is already archived.";
  if (activeLotCount > 0) {
    return `${activeLotCount} active specimen lot${activeLotCount === 1 ? "" : "s"} must be resolved through the inventory workflow before archiving.`;
  }
  return null;
}

// Where each catalog-completion check (by backend key) is fixed.
const CATALOG_CHECK_PATHS: Record<string, string> = {
  collection: "edit",
  accessionNumber: "edit",
  commonName: "edit",
  kingdom: "taxonomy",
  collectionDate: "provenance",
  preservationType: "provenance",
  preservationMethod: "provenance",
  activeLot: "lots/new",
};

/** Edit page for a failed readiness check, or null for a rule this UI doesn't know yet. */
export function catalogCheckHref(specimenId: string, key: string) {
  const path = CATALOG_CHECK_PATHS[key];
  return path ? `/specimens/${specimenId}/${path}` : null;
}

export const REOPEN_REASON_MAX = 500;

/**
 * Recognise the backend's edit guard ("<Field> is required for a Cataloged specimen. Reopen
 * cataloging before removing it.") in a 400 body and return it, so edit forms can show the
 * exact field instead of a generic "not saved" message.
 */
export function catalogedEditGuardMessage(body: unknown): string | null {
  const raw =
    typeof body === "object" && body !== null && "message" in body
      ? (body as { message: unknown }).message
      : null;
  const messages = Array.isArray(raw) ? raw : [raw];
  const guard = messages.find(
    (message): message is string =>
      typeof message === "string" && message.includes("Reopen cataloging before removing it"),
  );
  return guard
    ? `${guard} Use “Reopen cataloging” on the specimen page first.`
    : null;
}
