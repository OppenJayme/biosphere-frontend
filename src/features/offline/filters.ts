import type { CachedSpecimen, SpecimenRecord } from "./types";

export type CachedSpecimenStatusFilter = "ALL" | SpecimenRecord["status"];

export type CachedSpecimenFilters = {
  search: string;
  status: CachedSpecimenStatusFilter;
  category: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function filterCachedSpecimens(
  specimens: CachedSpecimen[],
  filters: CachedSpecimenFilters,
): CachedSpecimen[] {
  const search = normalize(filters.search);
  const category = normalize(filters.category);

  return specimens.filter((specimen) => {
    if (filters.status !== "ALL" && specimen.status !== filters.status) {
      return false;
    }

    if (
      category &&
      normalize(specimen.specimenCategory ?? "") !== category
    ) {
      return false;
    }

    if (!search) return true;

    return [
      specimen.accessionNumber,
      specimen.commonName,
      specimen.scientificName,
      specimen.specimenCategory,
      specimen.classificationStatus,
      specimen.gender,
      specimen.remarks,
      specimen.status,
    ].some((value) => normalize(value ?? "").includes(search));
  });
}

export function getCachedSpecimenCategories(
  specimens: CachedSpecimen[],
): string[] {
  const categories = new Map<string, string>();

  for (const specimen of specimens) {
    const category = specimen.specimenCategory?.trim();
    if (!category) continue;

    const key = category.toLowerCase();
    if (!categories.has(key)) categories.set(key, category);
  }

  return [...categories.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}
