import Link from "next/link";

const ENABLED =
  "rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-forest-700";
const DISABLED = "rounded-md border border-black/10 px-3 py-1.5 text-zinc-400";

/** Previous / "Page n of m" / Next, shared by the server-paginated record lists. */
export function PrevNextPagination({
  label,
  page,
  totalPages,
  hrefFor,
}: {
  label: string;
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={label} className="flex items-center gap-1.5 text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={ENABLED}>
          Previous
        </Link>
      ) : (
        <span className={DISABLED}>Previous</span>
      )}
      <span className="px-1 text-xs text-zinc-500">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={ENABLED}>
          Next
        </Link>
      ) : (
        <span className={DISABLED}>Next</span>
      )}
    </nav>
  );
}
