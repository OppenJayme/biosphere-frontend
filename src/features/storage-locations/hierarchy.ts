/** Pure helpers for safely presenting the database-backed storage hierarchy. */

import type { StorageUnit } from "./types";

export type StorageTreeNode = StorageUnit & { children: StorageTreeNode[] };

const byLabel = (a: StorageUnit, b: StorageUnit) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id);

export function buildStorageHierarchy(units: StorageUnit[]): StorageTreeNode[] {
  const nodes = new Map<string, StorageTreeNode>();
  for (const unit of units) nodes.set(unit.id, { ...unit, children: [] });

  const roots: StorageTreeNode[] = [];
  for (const unit of units) {
    const node = nodes.get(unit.id);
    if (!node) continue;

    const parent = unit.parentId ? nodes.get(unit.parentId) : undefined;
    if (!parent || hasUnsafeParentChain(unit.id, parent.id, nodes)) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }

  const sortTree = (tree: StorageTreeNode[]) => {
    tree.sort(byLabel);
    for (const node of tree) sortTree(node.children);
  };
  sortTree(roots);
  return roots;
}

// Broken legacy links must never hide the page or trap rendering in recursion.
function hasUnsafeParentChain(
  childId: string,
  parentId: string,
  nodes: Map<string, StorageTreeNode>,
): boolean {
  const visited = new Set<string>();
  let currentId: string | null | undefined = parentId;

  while (currentId) {
    if (currentId === childId || visited.has(currentId)) return true;
    visited.add(currentId);
    currentId = nodes.get(currentId)?.parentId;
  }

  return false;
}

export function filterStorageUnits(units: StorageUnit[], query: string): StorageUnit[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return units;

  return units.filter((unit) =>
    [unit.label, unit.unitType, unit.storageType, unit.size, unit.id]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(normalized)),
  );
}

export function storagePath(units: StorageUnit[], selectedId: string): StorageUnit[] {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const reversed: StorageUnit[] = [];
  const visited = new Set<string>();
  let current = unitsById.get(selectedId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    reversed.push(current);
    current = current.parentId ? unitsById.get(current.parentId) : undefined;
  }

  return reversed.reverse();
}

export function storageDescendantIds(units: StorageUnit[], selectedId: string): Set<string> {
  const childIds = new Map<string, string[]>();
  for (const unit of units) {
    if (!unit.parentId) continue;
    childIds.set(unit.parentId, [...(childIds.get(unit.parentId) ?? []), unit.id]);
  }

  const descendants = new Set<string>();
  const pending = [...(childIds.get(selectedId) ?? [])];
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id || id === selectedId || descendants.has(id)) continue;
    descendants.add(id);
    pending.push(...(childIds.get(id) ?? []));
  }
  return descendants;
}

/** A storage unit offered in a location filter, labelled by its full path. */
export type StoragePathOption = {
  id: string;
  pathLabel: string;
  archived: boolean;
};

/** Every unit as a root-to-unit path ("Room 101 › Cabinet A"), in hierarchy order. */
export function storagePathOptions(units: StorageUnit[]): StoragePathOption[] {
  const options: StoragePathOption[] = [];
  const visit = (nodes: StorageTreeNode[], parents: string[]) => {
    for (const node of nodes) {
      const path = [...parents, node.label];
      options.push({ id: node.id, pathLabel: path.join(" › "), archived: node.archivedAt !== null });
      visit(node.children, path);
    }
  };
  visit(buildStorageHierarchy(units), []);
  return options;
}
