/** One archive label for the tree, search, breadcrumbs, child cards and selected record. */
export function StorageLifecycleBadge({ archived, showActive = false }: { archived: boolean; showActive?: boolean }) {
  if (!archived && !showActive) return null;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      archived ? "bg-zinc-100 text-zinc-600" : "bg-emerald-50 text-emerald-700"
    }`}>
      {archived ? "Archived" : "Active"}
    </span>
  );
}
