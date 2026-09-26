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

type CatalogSection = "core" | "taxonomy" | "provenance" | "lots" | "other";

// Readable labels for the backend's missingFields keys, grouped by the section that edits them.
const CATALOG_FIELD_LABELS: Record<string, { section: CatalogSection; label: string }> = {
  accessionNumber: { section: "core", label: "Accession number" },
  collectionId: { section: "core", label: "Collection" },
  specimenCategory: { section: "core", label: "Specimen category" },
  scientificName: { section: "core", label: "Scientific name" },
  commonName: { section: "core", label: "Common name" },
  gender: { section: "core", label: "Gender" },
  "taxonomy.kingdom": { section: "taxonomy", label: "Kingdom" },
  "taxonomy.phylum": { section: "taxonomy", label: "Phylum" },
  "taxonomy.class": { section: "taxonomy", label: "Class" },
  "taxonomy.orderName": { section: "taxonomy", label: "Order" },
  "taxonomy.family": { section: "taxonomy", label: "Family" },
  "taxonomy.genus": { section: "taxonomy", label: "Genus" },
  "taxonomy.species": { section: "taxonomy", label: "Species" },
  "provenance.collectionDate": { section: "provenance", label: "Collection date" },
  "provenance.collectionLocation": { section: "provenance", label: "Collection location" },
  "provenance.preservationType": { section: "provenance", label: "Preservation type" },
  activeLot: { section: "lots", label: "At least one active specimen lot" },
};

const CATALOG_SECTIONS: { section: CatalogSection; title: string; path: string | null }[] = [
  { section: "core", title: "Core record", path: "edit" },
  { section: "taxonomy", title: "Taxonomy", path: "taxonomy" },
  { section: "provenance", title: "Provenance", path: "provenance" },
  { section: "lots", title: "Specimen lots", path: "lots/new" },
  { section: "other", title: "Other", path: null },
];

export type MissingCatalogGroup = {
  title: string;
  href: string | null;
  labels: string[];
};

/**
 * Group the backend's missing required fields by the section that edits them, in page order.
 * Unrecognised keys stay visible under "Other" so a new backend rule is never hidden.
 */
export function groupMissingCatalogFields(
  specimenId: string,
  missingFields: string[],
): MissingCatalogGroup[] {
  const bySection = new Map<CatalogSection, string[]>();
  for (const field of missingFields) {
    const known = CATALOG_FIELD_LABELS[field];
    const section = known?.section ?? "other";
    const labels = bySection.get(section) ?? [];
    labels.push(known?.label ?? field);
    bySection.set(section, labels);
  }

  return CATALOG_SECTIONS.filter(({ section }) => bySection.has(section)).map(
    ({ section, title, path }) => ({
      title,
      href: path ? `/specimens/${specimenId}/${path}` : null,
      labels: bySection.get(section) ?? [],
    }),
  );
}
