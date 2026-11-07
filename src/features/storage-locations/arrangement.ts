/**
 * Display copy of the backend's storage arrangement tiers
 * (storage-arrangement.policy.ts). The backend enforces them; this list only
 * suggests unit types and explains the rule in the form.
 */
export const STORAGE_ARRANGEMENT_TIERS = [
  { name: "Space", types: ["ROOM", "GALLERY", "STOREROOM", "LABORATORY", "BUILDING"] },
  { name: "Furniture", types: ["CABINET", "SHELVING_UNIT", "RACK", "COMPACTOR", "FREEZER", "TANK"] },
  { name: "Compartment", types: ["SHELF", "DRAWER", "TRAY"] },
  { name: "Container", types: ["BOX", "JAR", "BOTTLE", "CONTAINER", "BAG"] },
  { name: "Primary container", types: ["VIAL", "TUBE", "SLIDE", "ENVELOPE"] },
] as const;

/**
 * Readable suggestions ("Shelving unit", not "SHELVING_UNIT"). The backend compares unit types
 * ignoring case, spaces and hyphens, so either spelling gets the same tier.
 */
export const STORAGE_UNIT_TYPE_SUGGESTIONS = STORAGE_ARRANGEMENT_TIERS.flatMap((tier) =>
  tier.types.map((type) => type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ")),
);

export const STORAGE_ARRANGEMENT_HINT =
  "A unit can sit inside any larger tier (Space › Furniture › Compartment › Container › Primary container), so a box may go directly in a cabinet, but a room cannot go inside a cabinet or vial. Boxes and other containers may nest. Other unit types are not restricted.";
