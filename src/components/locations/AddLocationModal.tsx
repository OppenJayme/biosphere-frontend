"use client";

import { useMemo, useState } from "react";
import { fieldClasses } from "@/components/ui/Field";
import { CloseIcon, HomeIcon, ChevronDownIcon, ArchiveIcon, CubeIcon, PanelIcon, GridIcon } from "@/components/icons";
import {
  UNIT_TYPES,
  HIERARCHY_RULES,
  DRAWER_SIZE_LABELS,
  allowedUnitTypesFor,
  drawerSizeConstraint,
  type UnitType,
  type DrawerSize,
} from "@/lib/dummy-data/location-rules";
import { flattenLocations, pathTo, type LocationNode } from "@/lib/dummy-data/locations";

const UNIT_ICONS: Record<UnitType, typeof ArchiveIcon> = {
  Room: ArchiveIcon,
  Cabinet: CubeIcon,
  Drawer: PanelIcon,
  Container: ArchiveIcon,
  "Display Table": GridIcon,
  "Display Case": PanelIcon,
  "Display Shelf": PanelIcon,
  "Display Cabinet": CubeIcon,
};

const UNIT_LABEL_EXAMPLES: Record<UnitType, string> = {
  Room: "Storage Room",
  Cabinet: "Cabinet D",
  Drawer: "Drawer 01",
  Container: "Jar-02",
  "Display Table": "Table-01",
  "Display Case": "Display Case-01",
  "Display Shelf": "Display Shelf-01",
  "Display Cabinet": "DCAB-01",
};

/**
 * A leaf unit (Drawer, Container, ...) can't hold another location, so it's
 * never a valid default parent — walk up to the nearest ancestor that can.
 */
function resolveEligibleParentId(id: string | null, locations: LocationNode[]): string {
  if (!id) return "";
  const path = pathTo(id, locations);
  if (!path) return "";
  for (let i = path.length - 1; i >= 0; i--) {
    if (HIERARCHY_RULES[path[i].unitType].allowedChildren.length > 0) return path[i].id;
  }
  return "";
}

/**
 * Rendered only while the modal is open — the caller mounts/unmounts it (rather
 * than passing an `open` prop) so every open starts from a clean, freshly-seeded
 * state without needing a reset effect.
 */
export function AddLocationModal({
  onClose,
  locations,
  initialParentId,
}: {
  onClose: () => void;
  locations: LocationNode[];
  initialParentId: string | null;
}) {
  const flat = useMemo(() => flattenLocations(locations), [locations]);
  const [parentId, setParentId] = useState<string>(() => resolveEligibleParentId(initialParentId, locations));
  const [rawUnitType, setRawUnitType] = useState<UnitType | null>(null);
  const [label, setLabel] = useState("");
  const [rawDrawerSize, setRawDrawerSize] = useState<DrawerSize>("A3");

  // Only units that can actually hold children are valid parents — e.g. a Drawer
  // holds specimens directly and can never contain another location.
  const eligibleParents = useMemo(
    () => flat.filter((node) => HIERARCHY_RULES[node.unitType].allowedChildren.length > 0),
    [flat],
  );

  const parentNode = parentId ? (flat.find((n) => n.id === parentId) ?? null) : null;
  const parentType: UnitType | null = parentNode?.unitType ?? null;
  const allowedTypes = allowedUnitTypesFor(parentType);
  const sizeConstraint = drawerSizeConstraint(parentType);
  const siblingLabels = parentNode ? parentNode.children.map((c) => c.label.trim().toLowerCase()) : [];
  const isDuplicateLabel = label.trim() !== "" && siblingLabels.includes(label.trim().toLowerCase());

  // Derived rather than effect-synced: a stale choice just falls back to "unselected"
  // / the constraint's default the moment its parent no longer allows it.
  const unitType = rawUnitType && allowedTypes.includes(rawUnitType) ? rawUnitType : null;
  const drawerSize = sizeConstraint.allowed.includes(rawDrawerSize) ? rawDrawerSize : sizeConstraint.default;

  const rule = unitType ? HIERARCHY_RULES[unitType] : null;
  const pathLabels = parentId ? (pathTo(parentId, locations)?.map((n) => n.label) ?? []) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Add Location</h2>
            <p className="text-xs text-zinc-500">Create a new unit within your storage or display hierarchy.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-sage-50 px-3 py-2.5 text-sm">
            <HomeIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            {pathLabels.map((l) => (
              <span key={l} className="flex items-center gap-1.5 text-zinc-600">
                {l}
                <span className="text-zinc-300">/</span>
              </span>
            ))}
            <span className="rounded-full bg-forest-700 px-3 py-1 text-xs font-semibold text-white">
              {label || "New label..."}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900" htmlFor="parentLocation">
              Parent location
            </label>
            <div className="relative mt-1.5">
              <select
                id="parentLocation"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2.5 pl-3.5 pr-9 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="">— No parent (top-level Room) —</option>
                {eligibleParents.map((node) => (
                  <option key={node.id} value={node.id}>
                    {(pathTo(node.id, locations) ?? [node]).map((n) => n.label).join(" > ")}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {parentType ? HIERARCHY_RULES[parentType].canHoldHelp : "Top-level units must be Rooms."}
            </p>
          </div>

          {parentNode && (
            <div className="rounded-lg border border-black/10">
              <p className="border-b border-black/10 bg-sage-50 px-3 py-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Already inside {parentNode.label}
                {parentNode.children.length > 0 ? ` (${parentNode.children.length})` : ""}
              </p>
              {parentNode.children.length > 0 ? (
                <ul className="max-h-36 divide-y divide-black/5 overflow-y-auto">
                  {parentNode.children.map((child) => {
                    const Icon = UNIT_ICONS[child.unitType];
                    const isMatch = label.trim() !== "" && child.label.trim().toLowerCase() === label.trim().toLowerCase();
                    return (
                      <li
                        key={child.id}
                        className={`flex items-center gap-2 px-3 py-2 text-sm ${
                          isMatch ? "bg-amber-50 text-amber-800" : "text-zinc-600"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                        <span className="flex-1">{child.label}</span>
                        <span className="text-xs text-zinc-400">{child.unitType}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-3 py-2.5 text-xs text-zinc-400">Nothing here yet — this will be the first item.</p>
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-zinc-900">Unit type</p>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {UNIT_TYPES.map((type) => {
                const Icon = UNIT_ICONS[type];
                const enabled = allowedTypes.includes(type);
                const selected = unitType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setRawUnitType(type)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-colors ${
                      selected
                        ? "border-forest-700 bg-forest-50 text-forest-800"
                        : enabled
                          ? "border-black/10 text-zinc-600 hover:bg-sage-50"
                          : "cursor-not-allowed border-black/5 text-zinc-300"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {type}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {rule ? rule.placementHelp : "Select a unit type above."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900" htmlFor="label">
              Label <span className="font-normal text-zinc-400">&mdash; must be unique{parentId ? " within this parent" : ""}</span>
            </label>
            <input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`e.g. ${UNIT_LABEL_EXAMPLES[unitType ?? "Room"]}`}
              className={fieldClasses}
            />
            {isDuplicateLabel ? (
              <p className="mt-1.5 text-xs font-medium text-amber-700">
                &ldquo;{label.trim()}&rdquo; already exists inside {parentNode?.label} — choose a different label.
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500">
                Shown throughout the app, e.g. &ldquo;{UNIT_LABEL_EXAMPLES[unitType ?? "Room"]}&rdquo;.
              </p>
            )}
          </div>

          {rule && rule.sizeKind === "cabinet-capacity" && (
            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="size">
                Size <span className="font-normal text-zinc-400">&mdash; cabinet capacity</span>
              </label>
              <input id="size" type="number" min={1} placeholder="e.g. 6" className={fieldClasses} />
              <p className="mt-1.5 text-xs text-zinc-500">Number of cabinets this room is built to hold.</p>
            </div>
          )}

          {rule && rule.sizeKind === "drawer-capacity" && (
            <div>
              <label className="block text-sm font-medium text-zinc-900" htmlFor="size">
                Size <span className="font-normal text-zinc-400">&mdash; drawer capacity</span>
              </label>
              <input id="size" type="number" min={1} placeholder="e.g. 12" className={fieldClasses} />
              <p className="mt-1.5 text-xs text-zinc-500">Number of drawers this cabinet is built to hold.</p>
            </div>
          )}

          {rule && rule.sizeKind === "drawer-size" && (
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Size <span className="font-normal text-zinc-400">&mdash; drawer size</span>
              </p>
              <div className="mt-1.5 rounded-lg bg-sage-50 p-3">
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Drawer Size</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["A1", "A2", "A3"] as DrawerSize[]).map((size) => {
                    const enabled = sizeConstraint.allowed.includes(size);
                    const selected = drawerSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!enabled}
                        onClick={() => setRawDrawerSize(size)}
                        className={`rounded-lg border px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                          selected
                            ? "border-forest-700 bg-forest-700 text-white"
                            : enabled
                              ? "border-black/10 bg-white text-zinc-700 hover:bg-sage-100"
                              : "cursor-not-allowed border-black/5 bg-white text-zinc-300"
                        }`}
                      >
                        {size}
                        <span className={`block text-[10px] font-normal ${selected ? "text-white/80" : "text-zinc-400"}`}>
                          {DRAWER_SIZE_LABELS[size]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {sizeConstraint.warning && (
                  <p className="mt-2.5 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                    {sizeConstraint.warning}
                  </p>
                )}
              </div>
            </div>
          )}

          {rule && rule.sizeKind === "none" && (
            <div>
              <p className="text-sm font-medium text-zinc-900">
                Size <span className="font-normal text-zinc-400">(not applicable)</span>
              </p>
              <p className="mt-1.5 text-xs text-zinc-500">
                {unitType === "Container"
                  ? "Containers don't use a size value — track counts by accession code instead."
                  : "No size value — specimens can be assigned here directly, or grouped in a Container placed inside it."}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-black/10 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={!unitType || !label.trim() || isDuplicateLabel}
            className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
}
