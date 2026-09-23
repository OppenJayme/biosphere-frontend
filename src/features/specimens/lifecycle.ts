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
    confirmation: specimen.publicDisplay
      ? "Remove this specimen's public-display eligibility? This does not change its Cataloged status."
      : "Mark this Cataloged specimen as eligible for public display? This does not publish an exhibit or expose the internal record.",
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
