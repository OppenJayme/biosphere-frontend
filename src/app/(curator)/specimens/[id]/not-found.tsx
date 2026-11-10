import Link from "next/link";

export default function SpecimenNotFound() {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
      <h1 className="font-serif text-2xl font-semibold text-forest-800">Specimen not found</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-600">
        This specimen record does not exist, or its link is no longer valid.
      </p>
      <Link
        href="/specimens"
        className="mt-5 inline-flex rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
      >
        Return to specimen catalog
      </Link>
    </div>
  );
}
