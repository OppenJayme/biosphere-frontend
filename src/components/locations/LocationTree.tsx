"use client";

import { useState } from "react";
import { ChevronDownIcon, ArchiveIcon, CubeIcon, PanelIcon, GridIcon } from "@/components/icons";
import type { LocationNode } from "@/lib/dummy-data/locations";
import type { UnitType } from "@/lib/dummy-data/location-rules";

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

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: LocationNode;
  depth: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children.length > 0;
  const Icon = UNIT_ICONS[node.unitType];
  const selected = node.id === selectedId;

  return (
    <li>
      <div
        className={`flex items-center gap-1 rounded-lg pr-2 ${selected ? "bg-forest-50" : "hover:bg-sage-50"}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse" : "Expand"}
          className={`flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400 ${hasChildren ? "" : "invisible"}`}
        >
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`} />
        </button>
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-forest-700" : "text-zinc-400"}`} />
          <span className={`truncate text-sm ${selected ? "font-semibold text-forest-800" : "text-zinc-700"}`}>
            {node.label}
          </span>
          <span className="ml-auto shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            {node.unitType}
          </span>
        </button>
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LocationTree({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: LocationNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}
