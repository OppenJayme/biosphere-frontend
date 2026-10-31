import { SearchIcon } from "@/components/icons";
import { FilterChips } from "@/components/ui/FilterChips";
import { FILTER_TOGGLE_CLASSES, FilterToggleContent } from "@/components/ui/FilterToggle";
import { InfoTip } from "@/components/ui/InfoTip";
import { ClearSpecimenFiltersLink } from "./ClearSpecimenFiltersLink";
import {
  DEFAULT_SPECIMEN_PAGE_SIZE,
  hasAdvancedSpecimenFilters,
  SORT_DIRECTIONS,
  SPECIMEN_GENDERS,
  SPECIMEN_SORT_FIELDS,
  type MuseumCollection,
  specimenListHref,
  type SpecimenListQuery,
  type SpecimenStatus,
} from "@/features/specimens/types";
import type { StoragePathOption } from "@/features/storage-locations/hierarchy";

const SORT_LABELS: Record<(typeof SPECIMEN_SORT_FIELDS)[number], string> = {
  updatedAt: "Last updated",
  createdAt: "Date created",
  accessionNumber: "Accession number",
  scientificName: "Scientific name",
  commonName: "Common name",
  status: "Catalog status",
  specimenCategory: "Category",
  family: "Family",
};

const TAXONOMY_FIELDS = [
  ["kingdom", "Kingdom"],
  ["phylum", "Phylum"],
  ["taxonClass", "Class"],
  ["taxonOrder", "Order"],
  ["family", "Family"],
  ["genus", "Genus"],
  ["species", "Species"],
] as const;

function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hasNonDefaultFilters(query: SpecimenListQuery) {
  return (
    query.search.length > 0 ||
    query.status !== null ||
    query.collectionId !== null ||
    query.specimenCategory.length > 0 ||
    query.gender !== null ||
    query.publicDisplay !== null ||
    hasAdvancedSpecimenFilters(query) ||
    query.sortBy !== "updatedAt" ||
    query.sortDirection !== "desc"
  );
}

// A fixed height keeps text boxes and dropdowns level; browsers size them differently otherwise.
const baseControlClasses =
  "block h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:bg-zinc-100 disabled:text-zinc-500";
const controlClasses = `mt-1.5 ${baseControlClasses}`;

export function SpecimenToolbar({
  query,
  collections,
  collectionLookupAvailable,
  storageOptions,
  storageLookupAvailable,
  filterError,
  statusCounts,
}: {
  query: SpecimenListQuery;
  collections: MuseumCollection[];
  collectionLookupAvailable: boolean;
  storageOptions: StoragePathOption[];
  storageLookupAvailable: boolean;
  filterError: string | null;
  /** Whole-catalog totals per status, for the chip counts. Omitted when unavailable. */
  statusCounts?: Record<SpecimenStatus, number>;
}) {
  const hasFilters = hasNonDefaultFilters(query);
  const advancedOpen =
    hasAdvancedSpecimenFilters(query) ||
    query.specimenCategory.length > 0 ||
    query.gender !== null ||
    query.publicDisplay !== null;
  const hasOtherFilters =
    query.search.length > 0 || query.collectionId !== null || advancedOpen;
  const selectedUnitMissing =
    Boolean(query.storageUnitId) && !storageOptions.some((option) => option.id === query.storageUnitId);
  const selectedCollectionMissing =
    query.collectionId !== null &&
    !collections.some((collection) => collection.id === query.collectionId);

  const statusChip = (label: string, status: SpecimenListQuery["status"], count?: number) => ({
    label,
    // Totals describe the whole catalog, so they are hidden while other filters narrow the list.
    count: hasOtherFilters ? undefined : count,
    active: query.status === status,
    href: specimenListHref({ ...query, status }, 1),
  });

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
      <FilterChips
        label="Filter by catalog status"
        chips={[
          statusChip("All active", null, statusCounts ? statusCounts.UNCATALOGED + statusCounts.CATALOGED : undefined),
          statusChip("Uncataloged", "UNCATALOGED", statusCounts?.UNCATALOGED),
          statusChip("Cataloged", "CATALOGED", statusCounts?.CATALOGED),
          statusChip("Archived", "ARCHIVED", statusCounts?.ARCHIVED),
        ]}
      />

      {/* Reset uncontrolled fields only when the applied query changes. This
          keeps Clear all and Back/Forward aligned with the displayed results. */}
      <form
        key={JSON.stringify(query)}
        action="/specimens"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <input type="hidden" name="status" defaultValue={query.status ?? ""} />
        {query.limit !== DEFAULT_SPECIMEN_PAGE_SIZE && (
          <input type="hidden" name="limit" defaultValue={query.limit} />
        )}
        <label className="text-xs font-medium text-zinc-600 sm:col-span-2 xl:col-span-2">
          Search
          <span className="relative mt-1.5 block">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              name="search"
              defaultValue={query.search}
              maxLength={100}
              placeholder="Name, accession no., category, or collection…"
              className={`${baseControlClasses} pl-10`}
            />
          </span>
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Collection
          <select
            name="collectionId"
            defaultValue={query.collectionId ?? ""}
            disabled={!collectionLookupAvailable}
            className={controlClasses}
          >
            <option value="">
              {collectionLookupAvailable ? "All collections" : "Collection lookup unavailable"}
            </option>
            {selectedCollectionMissing && query.collectionId && (
              <option value={query.collectionId}>Selected collection unavailable</option>
            )}
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.collectionName}</option>
            ))}
          </select>
          {!collectionLookupAvailable && query.collectionId && (
            <input type="hidden" name="collectionId" value={query.collectionId} />
          )}
        </label>

        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
          <label className="text-xs font-medium text-zinc-600">
            Sort by
            <select name="sortBy" defaultValue={query.sortBy} className={controlClasses}>
              {SPECIMEN_SORT_FIELDS.map((field) => (
                <option key={field} value={field}>{SORT_LABELS[field]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-600">
            Order
            <select
              name="sortDirection"
              defaultValue={query.sortDirection}
              className={controlClasses}
            >
              {SORT_DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction === "asc" ? "Ascending" : "Descending"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-start gap-3 sm:col-span-2 xl:col-span-4">
          <details open={advancedOpen} className="group min-w-0 flex-1">
            <summary className={FILTER_TOGGLE_CLASSES}>
              <FilterToggleContent>
                More filters
                <InfoTip label="More filters" align="start">
                  Category, gender, public display, condition, storage location, tag, date added and taxonomy. Text
                  filters must match the whole value (capital letters don&apos;t matter). Dates use Philippine time.
                </InfoTip>
              </FilterToggleContent>
            </summary>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium text-zinc-600">
              Specimen category
              <input
                name="specimenCategory"
                defaultValue={query.specimenCategory}
                maxLength={100}
                placeholder="Exact category"
                className={controlClasses}
              />
            </label>
            <label className="text-xs font-medium text-zinc-600">
              Gender
              <select name="gender" defaultValue={query.gender ?? ""} className={controlClasses}>
                <option value="">All genders</option>
                {SPECIMEN_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>{enumLabel(gender)}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-zinc-600">
              Public eligibility
              <select
                name="publicDisplay"
                defaultValue={query.publicDisplay === null ? "" : String(query.publicDisplay)}
                className={controlClasses}
              >
                <option value="">All eligibility states</option>
                <option value="true">Eligible</option>
                <option value="false">Not eligible</option>
              </select>
            </label>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-medium text-zinc-600">
                Classification status
                <input
                  name="classificationStatus"
                  defaultValue={query.classificationStatus}
                  maxLength={100}
                  placeholder="e.g. Identified"
                  className={controlClasses}
                />
              </label>

              <label className="text-xs font-medium text-zinc-600">
                Condition (active lot)
                <input
                  name="conditionClass"
                  defaultValue={query.conditionClass}
                  maxLength={100}
                  placeholder="e.g. Good"
                  className={controlClasses}
                />
              </label>

              <label className="text-xs font-medium text-zinc-600">
                Tag
                <input
                  name="tag"
                  defaultValue={query.tag}
                  maxLength={100}
                  placeholder="Exact tag name"
                  className={controlClasses}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-zinc-600">
                  Added from
                  <input type="date" name="createdFrom" defaultValue={query.createdFrom} className={controlClasses} />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  Added to
                  <input type="date" name="createdTo" defaultValue={query.createdTo} className={controlClasses} />
                </label>
              </div>

              <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
                Storage location (active lot)
                <select
                  name="storageUnitId"
                  defaultValue={query.storageUnitId ?? ""}
                  disabled={!storageLookupAvailable}
                  className={controlClasses}
                >
                  <option value="">
                    {storageLookupAvailable ? "All locations" : "Location lookup unavailable"}
                  </option>
                  {selectedUnitMissing && query.storageUnitId && (
                    <option value={query.storageUnitId}>Selected location unavailable</option>
                  )}
                  {storageOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.pathLabel}
                      {option.archived ? " (archived)" : ""}
                    </option>
                  ))}
                </select>
                {!storageLookupAvailable && query.storageUnitId && (
                  <input type="hidden" name="storageUnitId" value={query.storageUnitId} />
                )}
              </label>

              <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
                Units inside the location
                <select
                  name="includeDescendantUnits"
                  defaultValue={query.includeDescendantUnits === false ? "false" : "true"}
                  className={controlClasses}
                >
                  <option value="true">Include cabinets, drawers, and other units inside it</option>
                  <option value="false">Only lots stored directly in it</option>
                </select>
              </label>

              {TAXONOMY_FIELDS.map(([name, label]) => (
                <label key={name} className="text-xs font-medium text-zinc-600">
                  {label}
                  <input
                    name={name}
                    defaultValue={query[name]}
                    maxLength={100}
                    placeholder="Exact name"
                    className={controlClasses}
                  />
                </label>
              ))}
            </div>
          </details>

          <div className="flex items-center gap-2">
            {hasFilters && <ClearSpecimenFiltersLink />}
            <button
              type="submit"
              className="h-10 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {filterError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {filterError}
        </p>
      )}

      {!storageLookupAvailable && (
        <p role="status" className="text-xs text-amber-800">
          Storage locations could not be loaded, so the location filter is unavailable.
        </p>
      )}

      {!collectionLookupAvailable && (
        <p role="status" className="text-xs text-amber-800">
          Collection choices could not be loaded. Other catalog filters remain available.
        </p>
      )}
    </div>
  );
}
