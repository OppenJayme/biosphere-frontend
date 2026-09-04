// BASELINE STORAGE HIERARCHY RULES.
// This is the ground truth for what the "Add Location" modal is allowed to do —
// it drives which Unit Type options are enabled for a given parent, what the
// "Size" field means for each unit type, and the Drawer-size constraint. Sourced
// from the design reference (`add-location rules.png` / the Add Location modal
// mockups). Keep this in sync if the real business rules change; everything else
// in the Location feature should read from here rather than hardcoding logic.

export type UnitType =
  | "Room"
  | "Cabinet"
  | "Drawer"
  | "Container"
  | "Display Table"
  | "Display Case"
  | "Display Shelf"
  | "Display Cabinet";

export const UNIT_TYPES: UnitType[] = [
  "Room",
  "Cabinet",
  "Drawer",
  "Container",
  "Display Table",
  "Display Case",
  "Display Shelf",
  "Display Cabinet",
];

export type DrawerSize = "A1" | "A2" | "A3";

export const DRAWER_SIZE_LABELS: Record<DrawerSize, string> = {
  A1: "Large",
  A2: "Medium",
  A3: "Small",
};

type SizeKind =
  | "cabinet-capacity" // Room — number of cabinets it's built to hold
  | "drawer-capacity" // Cabinet — number of drawers it's built to hold
  | "drawer-size" // Drawer — A1/A2/A3, constrained by parent
  | "none"; // Container, Display Table/Case/Shelf/Cabinet — no size value

export const HIERARCHY_RULES: Record<
  UnitType,
  {
    /** Unit types that may be created directly under this one. Empty = leaf (holds specimens directly). */
    allowedChildren: UnitType[];
    sizeKind: SizeKind;
    /** Shown under "Parent location" once a parent of this type is chosen — what it can hold. */
    canHoldHelp: string;
    /** Shown under the Unit Type grid once this type is selected — where it sits. */
    placementHelp: string;
  }
> = {
  Room: {
    allowedChildren: ["Cabinet", "Drawer", "Container", "Display Table", "Display Cabinet"],
    sizeKind: "cabinet-capacity",
    canHoldHelp: "A Room can hold Cabinets, Drawers (A3 by default), Containers, Display Tables, or Display Cabinets.",
    placementHelp: "Rooms sit at the top of the hierarchy.",
  },
  Cabinet: {
    allowedChildren: ["Drawer", "Container"],
    sizeKind: "drawer-capacity",
    canHoldHelp: "A Cabinet can hold Drawers (A1 or A2) or Containers.",
    placementHelp: "Cabinets sit inside a Room.",
  },
  Drawer: {
    allowedChildren: [],
    sizeKind: "drawer-size",
    canHoldHelp: "A Drawer holds specimens directly.",
    placementHelp: "Drawers sit inside a Cabinet (A1 or A2), or directly inside a Room (A3 by default).",
  },
  Container: {
    allowedChildren: [],
    sizeKind: "none",
    canHoldHelp: "A Container (box, jar, vial) holds specimens directly.",
    placementHelp:
      "Containers (box, jar, vial) can sit in a Room, Cabinet, Drawer, Display Shelf, Display Case, or Display Cabinet.",
  },
  "Display Table": {
    allowedChildren: ["Display Case", "Display Shelf"],
    sizeKind: "none",
    canHoldHelp: "A Display Table can hold Display Cases or Display Shelves, or specimens directly.",
    placementHelp: "Display Tables sit inside a Room.",
  },
  "Display Case": {
    allowedChildren: ["Container"],
    sizeKind: "none",
    canHoldHelp: "A Display Case can hold specimens directly, or a Container.",
    placementHelp: "Display Cases sit on a Display Table.",
  },
  "Display Shelf": {
    allowedChildren: ["Container"],
    sizeKind: "none",
    canHoldHelp: "A Display Shelf can hold specimens directly, or a Container.",
    placementHelp: "Display Shelves sit on a Display Table.",
  },
  "Display Cabinet": {
    allowedChildren: ["Container"],
    sizeKind: "none",
    canHoldHelp: "A Display Cabinet (glass doors/walls) can hold specimens directly, or a Container.",
    placementHelp: "Display Cabinets sit inside a Room.",
  },
};

/** Unit types selectable in the "Add Location" grid for a given parent (null = top-level). */
export function allowedUnitTypesFor(parentType: UnitType | null): UnitType[] {
  if (parentType === null) return ["Room"];
  return HIERARCHY_RULES[parentType].allowedChildren;
}

/** Which Drawer sizes are selectable — and the default — given the chosen parent. */
export function drawerSizeConstraint(parentType: UnitType | null): {
  allowed: DrawerSize[];
  default: DrawerSize;
  warning: string | null;
} {
  if (parentType === "Cabinet") {
    return { allowed: ["A1", "A2"], default: "A1", warning: "Drawers placed under a Cabinet must be A1 or A2." };
  }
  // Room (or top-level, though a Drawer can never actually be top-level) -> forced A3.
  return { allowed: ["A3"], default: "A3", warning: null };
}
