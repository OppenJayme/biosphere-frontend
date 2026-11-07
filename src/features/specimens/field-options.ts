/**
 * Pick-lists for specimen text fields. The Curator accepted on 2026-11-07 that details such as
 * specimen type and how it is preserved are picked from a list with an "Other" choice; the lists
 * themselves follow the team's 2026-11-01 proposal (museum practice, not live test data) and can
 * change in corrective maintenance.
 *
 * The database columns stay free text (REQ-4.4-14), so import, offline drafts and older records
 * may hold values that are not listed. Forms must keep those values rather than clear them.
 */

export type FieldOptionList = {
  options: readonly string[];
  /** Lists with Other accept any typed value; closed lists only keep an existing unlisted one. */
  allowOther: boolean;
};

export const SPECIMEN_CATEGORY_OPTIONS: FieldOptionList = {
  options: [
    "Mammal",
    "Bird",
    "Reptile",
    "Amphibian",
    "Fish",
    "Insect",
    "Arachnid",
    "Myriapod",
    "Crustacean",
    "Mollusk",
    "Echinoderm",
    "Coral and Cnidarian",
    "Sponge",
    "Worm",
    "Other Invertebrate",
    "Plant",
    "Fungus",
    "Alga",
  ],
  allowOther: true,
};

export const CLASSIFICATION_STATUS_OPTIONS: FieldOptionList = {
  options: [
    "Unidentified",
    "Pending verification",
    "Tentatively identified",
    "Identified to order",
    "Identified to family",
    "Identified to genus",
    "Identified to species",
  ],
  allowOther: true,
};

export const KINGDOM_OPTIONS: FieldOptionList = {
  options: ["Animalia", "Plantae", "Fungi", "Protista", "Bacteria", "Archaea"],
  allowOther: false,
};

/** The nine IUCN Red List categories. CITES and national listings go in tags. */
export const CONSERVATION_STATUS_OPTIONS: FieldOptionList = {
  options: [
    "Extinct (EX)",
    "Extinct in the Wild (EW)",
    "Critically Endangered (CR)",
    "Endangered (EN)",
    "Vulnerable (VU)",
    "Near Threatened (NT)",
    "Least Concern (LC)",
    "Data Deficient (DD)",
    "Not Evaluated (NE)",
  ],
  allowOther: false,
};

export const ECOLOGICAL_ROLE_OPTIONS: FieldOptionList = {
  options: [
    "Producer",
    "Herbivore",
    "Carnivore",
    "Omnivore",
    "Predator",
    "Apex predator",
    "Scavenger",
    "Decomposer",
    "Detritivore",
    "Pollinator",
    "Seed disperser",
    "Filter feeder",
    "Parasite",
  ],
  allowOther: true,
};

export const PRESERVATION_TYPE_OPTIONS: FieldOptionList = {
  options: ["Dry", "Wet", "Microscope slide", "Frozen", "Fossil", "Cast or replica"],
  allowOther: true,
};

/**
 * Suggested methods per preservation type. The method stays a typed field with suggestions, so a
 * method the list lacks never needs an Other step.
 */
export const PRESERVATION_METHOD_SUGGESTIONS: Record<string, readonly string[]> = {
  Dry: [
    "Pinned",
    "Pinned and spread",
    "Papered (envelope)",
    "Study skin",
    "Taxidermy mount",
    "Skeleton",
    "Freeze-dried",
    "Pressed and dried (herbarium sheet)",
  ],
  Wet: ["70% ethanol", "Formalin-fixed, stored in 70% ethanol", "Isopropanol", "Cleared and stained"],
  "Microscope slide": ["Canada balsam mount", "Euparal mount", "Hoyer's medium mount", "Temporary mount"],
  Frozen: ["Frozen tissue (-20 °C)", "Frozen tissue (-80 °C)", "Cryopreserved (liquid nitrogen)"],
  Fossil: ["Mineralized", "Cast in matrix", "Consolidated"],
  "Cast or replica": ["Resin cast", "Plaster cast", "3D-printed replica"],
};

/** Suggestions for the chosen type, or every suggestion when the type is blank or unlisted. */
export function preservationMethodSuggestions(type: string): readonly string[] {
  const listed = PRESERVATION_METHOD_SUGGESTIONS[matchListed(PRESERVATION_TYPE_OPTIONS, type)];
  return listed ?? Object.values(PRESERVATION_METHOD_SUGGESTIONS).flat();
}

/** Select-only marker for "Other…"; never a value that may be saved. */
export const OTHER_OPTION_VALUE = "__other__";

/** Collapses whitespace and adopts the listed spelling for a case-only difference. */
export function matchListed(list: FieldOptionList, value: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (text === OTHER_OPTION_VALUE) return "";
  const folded = text.toLocaleLowerCase();
  return list.options.find((option) => option.toLocaleLowerCase() === folded) ?? text;
}
