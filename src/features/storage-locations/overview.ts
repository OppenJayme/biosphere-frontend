/**
 * Figures for the Locations overview, derived only from data the backend already returns:
 * the hierarchy, the occupancy summary, a unit's inventory and its movement history. Nothing here
 * invents values the backend does not hold (no location codes, audit dates or "nearly full" level).
 */

import { adjustmentTypeLabel, transactionTypeLabel } from "../specimen-lots/operations";
import type { SpecimenLotHistoryEntry } from "../specimen-lots/types";
import type { StorageInventoryItem, StorageMovement, StorageOccupancy, StorageUnit } from "./types";

export type StorageTotals = {
  /** Specimens (summed lot quantities) in this unit and every active unit below it. */
  specimens: number;
  /** Active units here or below that are over their capacity, by label. */
  overCapacity: { id: string; label: string; occupied: number; capacity: number }[];
};

/**
 * Totals for every active unit, rolled up through the active hierarchy. The backend counts only
 * lots placed directly in a unit, so a room's or cabinet's totals are the sum of what is below it.
 */
export function storageTotals(units: StorageUnit[], occupancy: StorageOccupancy[]): Map<string, StorageTotals> {
  const active = units.filter((unit) => !unit.archivedAt);
  const byUnit = new Map(occupancy.map((entry) => [entry.id, entry]));
  const children = new Map<string, StorageUnit[]>();
  for (const unit of active) {
    if (!unit.parentId) continue;
    children.set(unit.parentId, [...(children.get(unit.parentId) ?? []), unit]);
  }

  const totals = new Map<string, StorageTotals>();
  const visit = (unit: StorageUnit, seen: Set<string>): StorageTotals => {
    const known = totals.get(unit.id);
    if (known) return known;
    const own = byUnit.get(unit.id);
    const result: StorageTotals = {
      specimens: own?.occupiedQuantity ?? 0,
      overCapacity:
        own && own.alertCount > 0 && own.capacity != null
          ? [{ id: unit.id, label: unit.label, occupied: own.occupiedQuantity, capacity: own.capacity }]
          : [],
    };
    // A malformed parent loop must not recurse forever; the hierarchy builder rejects it too.
    seen.add(unit.id);
    for (const child of children.get(unit.id) ?? []) {
      if (seen.has(child.id)) continue;
      const sub = visit(child, seen);
      result.specimens += sub.specimens;
      result.overCapacity.push(...sub.overCapacity);
    }
    totals.set(unit.id, result);
    return result;
  };
  for (const unit of active) visit(unit, new Set());
  return totals;
}

export type SpecimenGroup = { category: string; quantity: number; records: number };

/** A unit's lots grouped by specimen category, largest first; blank categories group together. */
export function specimenGroups(items: StorageInventoryItem[]): SpecimenGroup[] {
  const groups = new Map<string, { quantity: number; specimens: Set<string> }>();
  for (const { lot, specimen } of items) {
    const category = specimen.specimenCategory?.trim() || "Uncategorized";
    const group = groups.get(category) ?? { quantity: 0, specimens: new Set<string>() };
    group.quantity += lot.quantity;
    group.specimens.add(specimen.id);
    groups.set(category, group);
  }
  return [...groups.entries()]
    .map(([category, group]) => ({ category, quantity: group.quantity, records: group.specimens.size }))
    .sort((a, b) => b.quantity - a.quantity || a.category.localeCompare(b.category));
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const IMPORT_REASON = new RegExp(String.raw`^(Imported from row \d+)\s*\(batch ${UUID}\)`, "i");
const BRACKETED_ID = new RegExp(String.raw`\s*\([^()]*${UUID}[^()]*\)`, "gi");
const ANY_ID = new RegExp(UUID, "gi");

/**
 * A movement or lot reason fit to show: record ids are never displayed. The specimen import writes
 * "Imported from row 20 (batch <id>)", which reads as "Imported from row 20 of a spreadsheet
 * import"; any other id (e.g. pasted into a typed reason) is dropped, with its brackets.
 */
export function readableReason(reason: string | null): string | null {
  if (!reason) return null;
  const text = reason
    .replace(IMPORT_REASON, "$1 of a spreadsheet import")
    .replace(BRACKETED_ID, "")
    .replace(ANY_ID, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text || null;
}

export type ActivityEntry = { id: string; at: string; title: string; detail: string | null; by: string | null };

/**
 * The newest location moves and specimen-lot changes involving a unit, merged into one list.
 * Storage moves carry only an account id, so they show no name.
 */
export function recentActivity(
  unitId: string,
  units: StorageUnit[],
  movements: StorageMovement[],
  lotChanges: SpecimenLotHistoryEntry[],
  limit = Number.POSITIVE_INFINITY,
): ActivityEntry[] {
  // Never fall back to an id: a location missing from the list is described in words.
  const label = (id: string | null) => (id ? (units.find((unit) => unit.id === id)?.label ?? "a location no longer listed") : "top level");

  const moves: ActivityEntry[] = movements.map((move) => ({
    id: `move-${move.id}`,
    at: move.movedAt,
    title: move.storageUnitId === unitId ? "Location moved" : `${label(move.storageUnitId)} moved`,
    detail: [`From ${label(move.fromStorageUnitId)} to ${label(move.toStorageUnitId)}`, readableReason(move.reason)].filter(Boolean).join(". "),
    by: null,
  }));

  const lots: ActivityEntry[] = lotChanges.map((change) => {
    const quantity = change.quantityAffected != null ? `${change.quantityAffected} specimen${change.quantityAffected === 1 ? "" : "s"}` : null;
    let title = transactionTypeLabel(change.transactionType);
    let detail: string | null = quantity;
    if (change.transactionType === "MOVEMENT") {
      const incoming = change.toStorageUnitId === unitId;
      title = incoming ? "Specimen lot moved in" : "Specimen lot moved out";
      detail = [quantity, incoming ? `from ${label(change.fromStorageUnitId)}` : `to ${label(change.toStorageUnitId)}`]
        .filter(Boolean)
        .join(" ");
    } else if (change.transactionType === "QUANTITY_ADJUSTMENT" && change.adjustmentType) {
      title = `Quantity adjustment: ${adjustmentTypeLabel(change.adjustmentType).toLowerCase()}`;
    } else if (change.transactionType === "CONDITION_CHANGE" && change.fromConditionClass && change.toConditionClass) {
      detail = `${change.fromConditionClass} to ${change.toConditionClass}`;
    }
    detail = [detail, readableReason(change.reason)].filter(Boolean).join(". ") || null;
    return { id: `lot-${change.id}`, at: change.createdAt, title, detail, by: change.performedByName || null };
  });

  return [...moves, ...lots]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}
